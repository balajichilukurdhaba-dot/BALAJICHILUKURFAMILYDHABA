import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, logAdminAction } from '@/lib/auth';
import { unstable_cache, revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

// GET /api/cms/testimonials
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const approvedOnly = searchParams.get('approvedOnly') === 'true';

    const where: any = {};
    if (approvedOnly) {
      where.isApproved = true;
    }

    const testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ success: true, testimonials });
  } catch (error: any) {
    console.error('Error loading testimonials from Prisma:', error);
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
