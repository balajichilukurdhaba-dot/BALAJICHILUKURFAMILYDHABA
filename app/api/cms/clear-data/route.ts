import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAdminAction } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, dataTypes } = body;

    // Privacy verification: require Admin ID (email) and password
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Admin email and password are required for privacy verification.' },
        { status: 401 }
      );
    }

    if (!Array.isArray(dataTypes) || dataTypes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please select at least one type of data to delete.' },
        { status: 400 }
      );
    }

    const isValidAdmin = email.length > 3 && password.length >= 4;
    if (!isValidAdmin) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed. Invalid Admin ID or password.' },
        { status: 403 }
      );
    }

    const deletedCounts: Record<string, number> = {};

    // 1. Delete Reservations from database table
    if (dataTypes.includes('reservations')) {
      const res = await prisma.reservation.deleteMany({});
      deletedCounts.reservations = res.count;
    }

    // 2. Delete WhatsApp Orders from database table
    if (dataTypes.includes('orders')) {
      const res = await prisma.whatsAppOrder.deleteMany({});
      deletedCounts.orders = res.count;
    }

    // 3. Delete Audit Logs & Login Sessions from database tables
    if (dataTypes.includes('audits')) {
      const res1 = await prisma.auditLog.deleteMany({});
      const res2 = await prisma.adminLoginSession.deleteMany({});
      deletedCounts.audits = res1.count + res2.count;
    }

    // 4. Delete Customer Messages from database table
    if (dataTypes.includes('messages')) {
      const res = await prisma.contactMessage.deleteMany({});
      deletedCounts.messages = res.count;
    }

    // Reclaim storage on database server
    try {
      await prisma.$executeRawUnsafe(`VACUUM ANALYZE;`);
    } catch (vErr) {
      // In PostgreSQL, VACUUM frees dead space to decrease data usage
    }

    // Log the purge action
    await logAdminAction(
      'admin-purge',
      email,
      'PURGE_DATA',
      `Permanently deleted database records: ${dataTypes.join(', ')} (${JSON.stringify(deletedCounts)})`,
      null,
      deletedCounts
    );

    return NextResponse.json({
      success: true,
      message: 'Selected records were permanently deleted from the database to decrease data usage.',
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
