import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

    const [whatsappOrders, reservations, testimonials, queries] = await Promise.all([
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
