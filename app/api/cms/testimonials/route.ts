import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, logAdminAction } from '@/lib/auth';
import { unstable_cache, revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

const getCachedTestimonials = unstable_cache(
  async (approvedOnly: boolean) => {
    const where: any = {};
    if (approvedOnly) {
      where.isApproved = true;
    }
    return prisma.testimonial.findMany({
      where,
      orderBy: { order: 'asc' }
    });
  },
  ['testimonials-list'],
  { tags: ['testimonials'] }
);

async function fetchTestimonialsFromSupabase(approvedOnly: boolean) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!url || !key) return [];
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(url, key);

    let query = supabase.from('testimonials').select('*').order('order', { ascending: true });
    if (approvedOnly) {
      query = query.eq('is_approved', true);
    }
    const { data } = await query;
    if (!data) return [];

    return data.map((t: any) => ({
      id: t.id,
      name: t.name,
      role: t.role || 'Patron',
      content: t.content,
      rating: t.rating ?? 5,
      source: t.source || 'Google Reviews',
      avatar: t.avatar || null,
      date: t.date || 'Recently',
      isApproved: t.is_approved ?? t.isApproved ?? true,
      order: t.order ?? 0
    }));
  } catch {
    return [];
  }
}

// GET /api/cms/testimonials
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const approvedOnly = searchParams.get('approvedOnly') === 'true';

    let testimonials: any[] = [];
    try {
      testimonials = await getCachedTestimonials(approvedOnly);
    } catch {
      testimonials = await fetchTestimonialsFromSupabase(approvedOnly);
    }

    return NextResponse.json({ success: true, testimonials });
  } catch (error: any) {
    const fallback = await fetchTestimonialsFromSupabase(false);
    return NextResponse.json({ success: true, testimonials: fallback });
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
    
    // Explicitly check if isApproved is boolean. If submitted via website review or explicitly set false, force isApproved = false.
    let isApproved = false;
    if (typeof body.isApproved === 'boolean') {
      isApproved = body.isApproved;
    } else if (user && body.source !== 'Website Customer Review') {
      isApproved = true;
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        name: body.name.trim(),
        role: body.role ? body.role.trim() : 'Valued Customer',
        content: body.content.trim(),
        rating: ratingVal,
        source: body.source ? body.source.trim() : 'Website Customer Review',
        avatar: body.avatar || null,
        date: body.date || 'Just now',
        isApproved: isApproved,
        order: body.order ?? 0
      }
    });

    (revalidateTag as any)('testimonials');

    if (user) {
      await logAdminAction(user.id, user.email, 'CREATE_TESTIMONIAL', `Testimonial by: ${testimonial.name}`, null, testimonial);
    }

    return NextResponse.json({
      success: true,
      testimonial,
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
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, data } = body;

    if (!id || !data) {
      return NextResponse.json({ success: false, error: 'Missing testimonial ID or data' }, { status: 400 });
    }

    const oldVal = await prisma.testimonial.findUnique({ where: { id } });
    if (!oldVal) {
      return NextResponse.json({ success: false, error: 'Testimonial not found' }, { status: 404 });
    }

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: {
        name: data.name,
        role: data.role,
        content: data.content,
        rating: parseInt(data.rating, 10),
        source: data.source,
        avatar: data.avatar,
        date: data.date,
        isApproved: data.isApproved,
        order: data.order
      }
    });

    (revalidateTag as any)('testimonials');

    await logAdminAction(user.id, user.email, 'UPDATE_TESTIMONIAL', `Testimonial: ${testimonial.name}`, oldVal, testimonial);

    return NextResponse.json({ success: true, testimonial });
  } catch (error: any) {
    console.error('Error updating testimonial:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/cms/testimonials
export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing testimonial ID' }, { status: 400 });
    }

    const testimonial = await prisma.testimonial.findUnique({ where: { id } });
    if (!testimonial) {
      return NextResponse.json({ success: false, error: 'Testimonial not found' }, { status: 404 });
    }

    await prisma.testimonial.delete({ where: { id } });

    (revalidateTag as any)('testimonials');

    await logAdminAction(user.id, user.email, 'DELETE_TESTIMONIAL', `Testimonial: ${testimonial.name}`, testimonial, null);

    return NextResponse.json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting testimonial:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
