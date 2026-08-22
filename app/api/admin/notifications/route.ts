import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function parseValidDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lastSeenOrders = parseValidDate(searchParams.get('lastSeen_orders'));
    const lastSeenReservations = parseValidDate(searchParams.get('lastSeen_reservations'));
    const lastSeenQueries = parseValidDate(searchParams.get('lastSeen_queries'));
    const lastSeenTestimonials = parseValidDate(searchParams.get('lastSeen_testimonials'));

    let whatsappOrders = 0;
    let reservations = 0;
    let testimonials = 0;
    let queries = 0;

    try {
      const res = await Promise.all([
        prisma.whatsAppOrder.count({
          where: {
            status: 'sent',
            ...(lastSeenOrders ? { createdAt: { gt: lastSeenOrders } } : {})
          }
        }).catch(() => 0),

        prisma.reservation.count({
          where: {
            status: 'pending',
            ...(lastSeenReservations ? { createdAt: { gt: lastSeenReservations } } : {})
          }
        }).catch(() => 0),

        prisma.testimonial.count({
          where: { isApproved: false }
        }).catch(() => 0),

        prisma.contactMessage.count({
          where: {
            isRead: false,
            ...(lastSeenQueries ? { createdAt: { gt: lastSeenQueries } } : {})
          }
        }).catch(() => 0)
      ]);

      [whatsappOrders, reservations, testimonials, queries] = res;
    } catch {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      if (url && key) {
        const supabase = createClient(url, key);
        let qOrders = supabase.from('whatsapp_orders').select('*', { count: 'exact', head: true }).eq('status', 'sent');
        if (lastSeenOrders) qOrders = qOrders.gt('created_at', lastSeenOrders.toISOString());

        let qRes = supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        if (lastSeenReservations) qRes = qRes.gt('created_at', lastSeenReservations.toISOString());

        let qTest = supabase.from('testimonials').select('*', { count: 'exact', head: true }).eq('is_approved', false);

        let qMsg = supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('is_read', false);
        if (lastSeenQueries) qMsg = qMsg.gt('created_at', lastSeenQueries.toISOString());

        const [rOrders, rRes, rTest, rMsg] = await Promise.all([qOrders, qRes, qTest, qMsg]);
        whatsappOrders = rOrders.count || 0;
        reservations = rRes.count || 0;
        testimonials = rTest.count || 0;
        queries = rMsg.count || 0;
      }
    }

    return NextResponse.json({
      success: true,
      counts: {
        whatsapp_orders: whatsappOrders,
        reservations,
        testimonials,
        queries
      }
    });
  } catch (error: any) {
    console.error('Error fetching notification counts:', error);
    return NextResponse.json({
      success: true,
      counts: {
        whatsapp_orders: 0,
        reservations: 0,
        testimonials: 0,
        queries: 0
      }
    });
  }
}
