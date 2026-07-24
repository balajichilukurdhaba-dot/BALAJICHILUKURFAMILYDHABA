import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, logAdminAction } from '@/lib/auth';

// GET: Check / Verify coupon token validity OR list all coupons for admin
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    // If no token, it's an admin list request
    if (!token) {
      const user = await getSessionUser();
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const settings = await prisma.siteSettings.findMany({
        where: {
          key: {
            startsWith: 'coupon:'
          }
        }
      });

      const coupons = settings.map(s => {
        try {
          return JSON.parse(s.value);
        } catch {
          return null;
        }
      }).filter(Boolean);

      // Sort by generated date desc
      coupons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return NextResponse.json({ success: true, coupons });
    }

    // If token present, verify specific coupon
    const setting = await prisma.siteSettings.findUnique({
      where: { key: `coupon:${token}` }
    });

    if (!setting) {
      return NextResponse.json({ success: false, error: 'Invalid reward token or coupon code' }, { status: 404 });
    }

    const couponData = JSON.parse(setting.value);
    
    // Check if expired
    const isExpired = couponData.expiryEpoch && Date.now() > couponData.expiryEpoch;
    
    return NextResponse.json({
      success: true,
      valid: !couponData.isUsed && !isExpired && !couponData.isCancelled,
      coupon: {
        token: couponData.token,
        billNo: couponData.billNo,
        phone: couponData.phone,
        originalBill: couponData.originalBill,
        discountPercent: couponData.discountPercent,
        discountValue: couponData.discountValue,
        discountCategory: couponData.discountCategory,
        expiryEpoch: couponData.expiryEpoch,
        isUsed: couponData.isUsed,
        isCancelled: couponData.isCancelled || false,
        isExpired
      }
    });

  } catch (error: any) {
    console.error('Error verifying coupon:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create coupon token (Admin authenticated only)
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { originalBill, phone, discountValue, discountPercent, expiryEpoch, billNo, discountCategory } = body;

    if (!originalBill || isNaN(Number(originalBill))) {
      return NextResponse.json({ success: false, error: 'Valid base bill total is required' }, { status: 400 });
    }
    if (!billNo) {
      return NextResponse.json({ success: false, error: 'Bill Number is required' }, { status: 400 });
    }
    if (!phone || phone.trim() === '' || phone === 'Walk-in' || phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ success: false, error: 'Valid 10-digit customer mobile phone number is required' }, { status: 400 });
    }

    const billAmount = Number(originalBill);
    const pct = discountPercent !== undefined ? Number(discountPercent) : 10;
    const discountVal = discountValue !== undefined ? Number(discountValue) : Math.round(billAmount * (pct / 100));
    const expiryEp = expiryEpoch !== undefined ? Number(expiryEpoch) : Date.now() + 17 * 24 * 60 * 60 * 1000;

    // Generate cryptographic-style tracking coupon code
    const randPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timePart = Date.now().toString().slice(-4);
    const token = `BSD-REWARD-${randPart}-${timePart}`;

    const couponPayload = {
      token,
      billNo: billNo.trim(),
      phone: phone ? phone.trim() : 'Walk-in',
      originalBill: billAmount,
      discountPercent: pct,
      discountValue: discountVal,
      discountCategory: discountCategory || 'Manual Custom',
      expiryEpoch: expiryEp,
      isUsed: false,
      isCancelled: false,
      createdAt: new Date().toISOString(),
      createdBy: user.email
    };

    // Store coupon setting in SiteSettings
    await prisma.siteSettings.upsert({
      where: { key: `coupon:${token}` },
      update: {
        value: JSON.stringify(couponPayload)
      },
      create: {
        key: `coupon:${token}`,
        value: JSON.stringify(couponPayload)
      }
    });

    // Log admin action for transparency
    await logAdminAction(
      user.id,
      user.email,
      'CREATE_REWARD_COUPON',
      `coupon:${token}`,
      null,
      couponPayload
    );

    return NextResponse.json({
      success: true,
      token,
      discountValue: discountVal,
      expiryEpoch: expiryEp
    });

  } catch (error: any) {
    console.error('Error generating coupon:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Claim / Redeem coupon token (Public menu validation route OR admin manual mark as redeemed)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    const setting = await prisma.siteSettings.findUnique({
      where: { key: `coupon:${token}` }
    });

    if (!setting) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    const couponData = JSON.parse(setting.value);

    if (couponData.isUsed) {
      return NextResponse.json({ success: false, error: 'This reward coupon has already been redeemed' }, { status: 400 });
    }
    if (couponData.isCancelled) {
      return NextResponse.json({ success: false, error: 'This reward coupon has been cancelled' }, { status: 400 });
    }

    const isExpired = couponData.expiryEpoch && Date.now() > couponData.expiryEpoch;
    if (isExpired) {
      return NextResponse.json({ success: false, error: 'This reward coupon has expired' }, { status: 400 });
    }

    // Mark as used
    couponData.isUsed = true;
    couponData.usedAt = new Date().toISOString();

    // Check if the request is from admin or public
    const user = await getSessionUser();
    if (user) {
      couponData.redeemedBy = user.email;
    }

    await prisma.siteSettings.update({
      where: { key: `coupon:${token}` },
      data: {
        value: JSON.stringify(couponData)
      }
    });

    return NextResponse.json({
      success: true,
      redeemed: true,
      discountValue: couponData.discountValue
    });

  } catch (error: any) {
    console.error('Error redeeming coupon:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Cancel coupon voucher (Admin authenticated only)
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    const setting = await prisma.siteSettings.findUnique({
      where: { key: `coupon:${token}` }
    });

    if (!setting) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    const couponData = JSON.parse(setting.value);
    
    // Mark as cancelled instead of hard deleting, to preserve logs and visual history!
    couponData.isCancelled = true;
    couponData.cancelledAt = new Date().toISOString();
    couponData.cancelledBy = user.email;

    await prisma.siteSettings.update({
      where: { key: `coupon:${token}` },
      data: {
        value: JSON.stringify(couponData)
      }
    });

    // Log admin action
    await logAdminAction(
      user.id,
      user.email,
      'CANCEL_REWARD_COUPON',
      `coupon:${token}`,
      null,
      couponData
    );

    return NextResponse.json({ success: true, message: 'Voucher successfully cancelled' });

  } catch (error: any) {
    console.error('Error cancelling coupon:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
