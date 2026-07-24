import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, logAdminAction } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/cms/offers
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || '';
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const homepageOnly = searchParams.get('homepageOnly') === 'true';

    // Auto-seed default campaigns if table is completely empty
    const totalCount = await prisma.offer.count();
    if (totalCount === 0) {
      await prisma.offer.createMany({
        data: [
          {
            title: '10% Off Online Bookings',
            badge: 'Limited Time',
            description: JSON.stringify({
              comboDishes: [],
              discountType: 'percentage',
              discountValue: '10',
              targetBranches: [],
              text: 'Skip the wait and get 10% off your entire bill when you reserve a table online.'
            }),
            price: '-10% OFF',
            cta: 'Book Now',
            link: '/reserve',
            image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
            isActive: true,
            showOnHomepage: true,
            displayPriority: 10
          },
          {
            title: 'Jumbo Family Pack',
            badge: 'Best Value',
            description: JSON.stringify({
              comboDishes: ['Veg Biryani', 'Paneer Butter Masala', 'Tandoori Roti', 'Gulab Jamun'],
              discountType: 'fixed',
              discountValue: '1499',
              targetBranches: [],
              text: 'Perfect for 4-5 people. Includes Biryani, Curries, Rotis, and Desserts.'
            }),
            price: '₹1499',
            cta: 'Order Now',
            link: '/menu',
            image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
            isActive: true,
            showOnHomepage: true,
            displayPriority: 5
          }
        ]
      });
    }

    const where: any = {};

    if (activeOnly) {
      where.isActive = true;
      
      // Auto-expire scheduler check
      const now = new Date();
      where.OR = [
        {
          startDate: null,
          endDate: null
        },
        {
          startDate: { lte: now },
          endDate: { gte: now }
        },
        {
          startDate: { lte: now },
          endDate: null
        },
        {
          startDate: null,
          endDate: { gte: now }
        }
      ];
    }

    if (homepageOnly) {
      where.showOnHomepage = true;
    }

    if (branchId) {
      where.OR = [
        { branchId: null }, // Global offers
        { branchId: branchId } // Branch-specific offers
      ];
    }

    const offers = await prisma.offer.findMany({
      where,
      orderBy: { displayPriority: 'desc' }
    });

    return NextResponse.json({ success: true, offers });
  } catch (error: any) {
    console.error('Error fetching offers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/cms/offers
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.title || !body.description || !body.price || !body.image) {
      return NextResponse.json({ success: false, error: 'Missing required offer fields' }, { status: 400 });
    }

    const offer = await prisma.offer.create({
      data: {
        title: body.title,
        description: body.description,
        price: body.price,
        image: body.image,
        badge: body.badge || 'Offer',
        cta: body.cta || 'Order Now',
        link: body.link || '/menu',
        isActive: body.isActive ?? true,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        showOnHomepage: body.showOnHomepage ?? true,
        displayPriority: body.displayPriority ?? 0,
        branchId: body.branchId || null
      }
    });

    await logAdminAction(user.id, user.email, 'CREATE_OFFER', `Offer: ${offer.title}`, null, offer);

    return NextResponse.json({ success: true, offer });
  } catch (error: any) {
    console.error('Error creating offer:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/cms/offers
export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, data } = body;

    if (!id || !data) {
      return NextResponse.json({ success: false, error: 'Missing offer ID or data' }, { status: 400 });
    }

    const oldVal = await prisma.offer.findUnique({ where: { id } });
    if (!oldVal) {
      return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 });
    }

    const offer = await prisma.offer.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        image: data.image,
        badge: data.badge,
        cta: data.cta,
        link: data.link,
        isActive: data.isActive,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        showOnHomepage: data.showOnHomepage,
        displayPriority: data.displayPriority,
        branchId: data.branchId || null
      }
    });

    await logAdminAction(user.id, user.email, 'UPDATE_OFFER', `Offer: ${offer.title}`, oldVal, offer);

    return NextResponse.json({ success: true, offer });
  } catch (error: any) {
    console.error('Error updating offer:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/cms/offers
export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing offer ID' }, { status: 400 });
    }

    const offer = await prisma.offer.findUnique({ where: { id } });
    if (!offer) {
      return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 });
    }

    await prisma.offer.delete({ where: { id } });

    await logAdminAction(user.id, user.email, 'DELETE_OFFER', `Offer: ${offer.title}`, offer, null);

    return NextResponse.json({ success: true, message: 'Offer deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting offer:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
