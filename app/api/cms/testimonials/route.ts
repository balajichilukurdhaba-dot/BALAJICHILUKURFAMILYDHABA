import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, logAdminAction } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

// GET /api/cms/testimonials
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const approvedOnly = searchParams.get('approvedOnly') === 'true';

    const where: any = {};
    if (approvedOnly) {
      where.isApproved = true;
    }

    try {
      const testimonials = await prisma.testimonial.findMany({
        where,
        orderBy: [{ order: 'asc' }, { id: 'desc' }]
      });
      return NextResponse.json({ success: true, testimonials });
    } catch (prismaError) {
      console.warn('[testimonials] Prisma error, using Supabase fallback:', prismaError);
      const supabase = getSupabaseClient();
      if (supabase) {
        let query = supabase.from('testimonials').select('*');
        if (approvedOnly) {
          query = query.eq('is_approved', true);
        }
        const { data, error } = await query.order('order', { ascending: true });
        if (!error && data) {
          const mapped = data.map((t: any) => ({
            id: t.id,
            name: t.name,
            role: t.role,
            content: t.content,
            rating: t.rating,
            source: t.source,
            avatar: t.avatar,
            date: t.date,
            isApproved: t.is_approved ?? t.isApproved ?? true,
            order: t.order ?? 0
          }));
          return NextResponse.json({ success: true, testimonials: mapped });
        }
      }
      return NextResponse.json({ success: true, testimonials: [] });
    }
  } catch (error: any) {
    console.error('Error loading testimonials:', error);
    return NextResponse.json({ success: false, error: error.message, testimonials: [] }, { status: 500 });
  }
}

// POST /api/cms/testimonials
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const body = await request.json();

    if (!body.name || !body.content || !body.rating) {
      return NextResponse.json({ success: false, error: 'Missing name, content, or rating' }, { status: 400 });
    }

    const ratingVal = Math.min(5, Math.max(1, parseInt(body.rating, 10) || 5));
    
    // If admin is adding, default to approved unless specified. If user submitted from website, force isApproved = false
    let isApproved = false;
    if (typeof body.isApproved === 'boolean') {
      isApproved = body.isApproved;
    } else if (user && body.source !== 'Website Customer Review') {
      isApproved = true;
    }

    const recordData = {
      name: body.name.trim(),
      role: body.role ? body.role.trim() : 'Valued Customer',
      content: body.content.trim(),
      rating: ratingVal,
      source: body.source ? body.source.trim() : 'Website Customer Review',
      avatar: body.avatar || null,
      date: body.date || 'Just now',
      isApproved: isApproved,
      order: body.order ?? 0
    };

    let createdRecord = null;

    try {
      createdRecord = await prisma.testimonial.create({
        data: recordData
      });
    } catch (prismaError) {
      console.warn('[testimonials] Prisma create failed, trying Supabase fallback:', prismaError);
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from('testimonials').insert({
          name: recordData.name,
          role: recordData.role,
          content: recordData.content,
          rating: recordData.rating,
          source: recordData.source,
          avatar: recordData.avatar,
          date: recordData.date,
          is_approved: recordData.isApproved,
          order: recordData.order
        }).select().single();

        if (!error && data) {
          createdRecord = {
            id: data.id,
            ...recordData,
            isApproved: data.is_approved
          };
        }
      }
    }

    if (!createdRecord) {
      throw new Error('Failed to insert testimonial into database');
    }

    if (user) {
      await logAdminAction(user.id, user.email, 'CREATE_TESTIMONIAL', `Testimonial by: ${createdRecord.name}`, null, createdRecord);
    }

    return NextResponse.json({
      success: true,
      testimonial: createdRecord,
      message: user ? 'Testimonial created successfully' : 'Thank you! Your review has been submitted for moderation.'
    });
  } catch (error: any) {
    console.error('Error creating testimonial:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/cms/testimonials
export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();
    const body = await request.json();
    const { id, data } = body;

    if (!id || !data) {
      return NextResponse.json({ success: false, error: 'Missing testimonial ID or data' }, { status: 400 });
    }

    let updatedRecord = null;

    try {
      const oldVal = await prisma.testimonial.findUnique({ where: { id } }).catch(() => null);
      updatedRecord = await prisma.testimonial.update({
        where: { id },
        data: {
          name: data.name,
          role: data.role,
          content: data.content,
          rating: parseInt(data.rating, 10) || 5,
          source: data.source,
          avatar: data.avatar,
          date: data.date,
          isApproved: data.isApproved,
          order: data.order ?? 0
        }
      });

      if (user) {
        await logAdminAction(user.id, user.email, 'UPDATE_TESTIMONIAL', `Testimonial: ${updatedRecord.name}`, oldVal, updatedRecord);
      }
    } catch (prismaError) {
      console.warn('[testimonials] Prisma update failed, trying Supabase fallback:', prismaError);
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: supaData, error } = await supabase.from('testimonials').update({
          name: data.name,
          role: data.role,
          content: data.content,
          rating: parseInt(data.rating, 10) || 5,
          source: data.source,
          avatar: data.avatar,
          date: data.date,
          is_approved: data.isApproved,
          order: data.order ?? 0
        }).eq('id', id).select().single();

        if (!error && supaData) {
          updatedRecord = {
            id: supaData.id,
            name: supaData.name,
            role: supaData.role,
            content: supaData.content,
            rating: supaData.rating,
            source: supaData.source,
            avatar: supaData.avatar,
            date: supaData.date,
            isApproved: supaData.is_approved,
            order: supaData.order
          };
        }
      }
    }

    if (!updatedRecord) {
      return NextResponse.json({ success: false, error: 'Testimonial could not be updated' }, { status: 400 });
    }

    return NextResponse.json({ success: true, testimonial: updatedRecord });
  } catch (error: any) {
    console.error('Error updating testimonial:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/cms/testimonials
export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing testimonial ID' }, { status: 400 });
    }

    let deleted = false;

    try {
      const testimonial = await prisma.testimonial.findUnique({ where: { id } }).catch(() => null);
      await prisma.testimonial.delete({ where: { id } });
      deleted = true;
      if (user && testimonial) {
        await logAdminAction(user.id, user.email, 'DELETE_TESTIMONIAL', `Testimonial: ${testimonial.name}`, testimonial, null);
      }
    } catch (prismaError) {
      console.warn('[testimonials] Prisma delete failed, trying Supabase fallback:', prismaError);
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('testimonials').delete().eq('id', id);
        if (!error) deleted = true;
      }
    }

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Failed to delete testimonial' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting testimonial:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
