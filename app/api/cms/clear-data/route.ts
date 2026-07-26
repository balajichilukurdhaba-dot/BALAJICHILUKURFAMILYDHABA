import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAdminAction } from '@/lib/auth';
import { verifySupabaseAdminAuth } from '@/lib/verifyAdminAuth';

function getDateCutoff(range?: string, beforeDate?: string): Date | undefined {
  if (!range || range === 'all') return undefined;

  const now = new Date();
  if (range === 'older_7') {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (range === 'older_30') {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  if (range === 'older_90') {
    return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }
  if (range === 'older_180') {
    return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  }
  if (range === 'custom' && beforeDate) {
    return new Date(beforeDate);
  }
  return undefined;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, dataTypes, timelines } = body;

    // Strict Supabase Auth verification
    const authResult = await verifySupabaseAdminAuth(email || '', password || '');
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication failed. Invalid Supabase Admin credentials.' },
        { status: 401 }
      );
    }

    if (!Array.isArray(dataTypes) || dataTypes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please select at least one category to delete.' },
        { status: 400 }
      );
    }

    const deletedCounts: Record<string, number> = {};

    // 1. Delete Reservations by timeline filter
    if (dataTypes.includes('reservations')) {
      const config = timelines?.reservations || {};
      const cutoff = getDateCutoff(config.range, config.beforeDate);
      const where = cutoff ? { createdAt: { lt: cutoff } } : {};
      const res = await prisma.reservation.deleteMany({ where });
      deletedCounts.reservations = res.count;
    }

    // 2. Delete WhatsApp Orders by timeline filter
    if (dataTypes.includes('orders')) {
      const config = timelines?.orders || {};
      const cutoff = getDateCutoff(config.range, config.beforeDate);
      const where = cutoff ? { createdAt: { lt: cutoff } } : {};
      const res = await prisma.whatsAppOrder.deleteMany({ where });
      deletedCounts.orders = res.count;
    }

    // 3. Delete Audit Logs & Login Sessions by timeline filter
    if (dataTypes.includes('audits')) {
      const config = timelines?.audits || {};
      const cutoff = getDateCutoff(config.range, config.beforeDate);
      const where = cutoff ? { createdAt: { lt: cutoff } } : {};
      const res1 = await prisma.auditLog.deleteMany({ where });
      const res2 = await prisma.adminLoginSession.deleteMany({ where });
      deletedCounts.audits = res1.count + res2.count;
    }

    // 4. Delete Customer Messages by timeline filter
    if (dataTypes.includes('messages')) {
      const config = timelines?.messages || {};
      const cutoff = getDateCutoff(config.range, config.beforeDate);
      const where = cutoff ? { createdAt: { lt: cutoff } } : {};
      const res = await prisma.contactMessage.deleteMany({ where });
      deletedCounts.messages = res.count;
    }

    // Reclaim storage on database server
    try {
      await prisma.$executeRawUnsafe(`VACUUM ANALYZE;`);
    } catch (vErr) {
      // In PostgreSQL, VACUUM reclaims freed space
    }

    // Log the purge action
    await logAdminAction(
      'admin-purge',
      email,
      'PURGE_DATA',
      `Deleted database records by timeline: ${dataTypes.join(', ')} (${JSON.stringify(deletedCounts)})`,
      null,
      deletedCounts
    );

    return NextResponse.json({
      success: true,
      message: 'Selected timeline records were permanently deleted from the database.',
      deletedCounts
    });
  } catch (error: any) {
    console.error('Error clearing data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete database records.' },
      { status: 500 }
    );
  }
}
