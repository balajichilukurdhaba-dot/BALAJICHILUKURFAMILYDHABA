import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

// Secret key for HMAC signing QR tokens (should be in .env in production)
const QR_SECRET_KEY = process.env.QR_SECRET_KEY || 'fallback-dev-secret-key-12345';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { branchId, customerName, phone, email, guests, date, time, specialInstructions } = body;

    // Validate input
    if (!branchId || !customerName || !phone || !guests || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate unique booking reference (e.g., RES-83F2A)
    const bookingRef = 'RES-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    // Safely check and resolve branch ID
    let branch = null;
    try {
      branch = await prisma.branch.findUnique({ where: { id: branchId } });
    } catch {
      branch = null;
    }

    if (!branch) {
      branch = await prisma.branch.findFirst();
    }

    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          name: 'Balaji Dhaba Moinabad Branch',
          address: 'Chilkur Balaji Temple Road, Moinabad',
          phone: '+91 99890 00000',
          totalTables: 30,
          openingTime: '11:00 AM',
          closingTime: '11:00 PM'
        }
      });
    }

    const resolvedBranchId = branch.id;

    // Generate HMAC-signed QR token for the 10% discount
    const payload = JSON.stringify({ bookingRef, phone });
    const signature = crypto.createHmac('sha256', QR_SECRET_KEY).update(payload).digest('hex');
    const qrToken = `${Buffer.from(payload).toString('base64')}.${signature}`;

    // Create reservation in database
    const reservation = await prisma.reservation.create({
      data: {
        bookingRef,
        branchId: resolvedBranchId,
        customerName,
        phone,
        email,
        guests: parseInt(guests) || 1,
        date: new Date(date),
        time,
        specialInstructions,
        qrToken,
      }
    });

    return NextResponse.json({
      success: true,
      reservation,
      qrToken, // The frontend will use this to render the QR code
      message: 'Reservation confirmed successfully!'
    }, { status: 201 });

  } catch (error) {
    console.error('Reservation Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status, discountVerified } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        status: status !== undefined ? status : undefined,
        discountVerified: discountVerified !== undefined ? discountVerified : undefined
      }
    });

    return NextResponse.json({ success: true, reservation: updated });
  } catch (error: any) {
    console.error('Update Reservation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
