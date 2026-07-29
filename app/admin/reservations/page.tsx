import React from 'react';
import prisma from '@/lib/prisma';
import ReservationsClient from './ReservationsClient';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

async function fetchFromSupabase() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!url || !key) return [];

    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('date', { ascending: false });

    if (error || !data) return [];

    return data.map((r: any) => ({
      id: r.id,
      bookingRef: r.booking_ref || r.bookingRef || '',
      branchId: r.branch_id || r.branchId || '',
      customerName: r.customer_name || r.customerName || '',
      phone: r.phone || '',
      email: r.email || null,
      guests: r.guests || 1,
      date: r.date || '',
      time: r.time || '',
      specialInstructions: r.special_instructions || r.specialInstructions || null,
      bookedOnline: r.booked_online ?? r.bookedOnline ?? true,
      status: r.status || 'pending',
      qrToken: r.qr_token || r.qrToken || null,
      qrScannedAt: r.qr_scanned_at || r.qrScannedAt || null,
      discountVerified: r.discount_verified ?? r.discountVerified ?? false,
      createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export default async function ReservationsManagementPage() {
  let reservations: any[] = [];
  try {
    reservations = await prisma.reservation.findMany({
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ]
    });
  } catch {
    // If Prisma connection fails (e.g. IPv6 port 5432 network timeout), seamlessly fallback to Supabase REST API
    reservations = await fetchFromSupabase();
  }

  // Serialize DateTime objects to plain primitives for the Client Component
  const serialized = reservations.map((r) => {
    let dateStr = '';
    if (r.date instanceof Date) {
      const y = r.date.getUTCFullYear();
      const m = String(r.date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(r.date.getUTCDate()).padStart(2, '0');
      dateStr = `${y}-${m}-${d}`;
    } else {
      dateStr = String(r.date || '');
    }

    return {
      ...r,
      date: dateStr,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt || ''),
      qrScannedAt: r.qrScannedAt instanceof Date ? r.qrScannedAt.toISOString() : (r.qrScannedAt ? String(r.qrScannedAt) : null),
    };
  });

  return <ReservationsClient initialReservations={serialized} />;
}
