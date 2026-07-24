import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone')?.trim();
    const ref = searchParams.get('ref')?.trim();

    if (!phone && !ref) {
      return NextResponse.json({ error: 'Please provide a phone number or booking reference.' }, { status: 400 });
    }

    const whereClause: any = {};
    if (ref) {
      whereClause.bookingRef = { equals: ref, mode: 'insensitive' };
    } else if (phone) {
      // Strip spaces/dashes for clean matching
      const cleanedPhone = phone.replace(/\D/g, '');
      whereClause.phone = { contains: cleanedPhone.slice(-10) };
    }

    const reservations = await prisma.reservation.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const serialized = reservations.map(r => ({
      id: r.id,
      bookingRef: r.bookingRef,
      customerName: r.customerName,
      phone: r.phone,
      guests: r.guests,
      date: r.date.toISOString().split('T')[0],
      time: r.time,
      qrToken: r.qrToken,
      status: r.status,
      discountVerified: r.discountVerified
    }));

    return NextResponse.json({
      success: true,
      reservations: serialized
    });

  } catch (error: any) {
    console.error('Reservation Lookup Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve booking pass' }, { status: 500 });
  }
}
