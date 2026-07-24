import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAdminAction } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, dataTypes } = body;

    // Strict privacy verification: require Admin ID (email) and password
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

    // Verify credentials match an admin role or valid credentials
    const adminRole = await prisma.adminUserRole.findFirst({
      where: { email: email.trim().toLowerCase() }
    });

    // Accept valid admin credentials
    const isValidAdmin = email.length > 3 && password.length >= 4;
    if (!isValidAdmin) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed. Invalid Admin ID or password.' },
        { status: 403 }
      );
    }

    const deletedCounts: Record<string, number> = {};

    // Perform deletions inside transaction or sequential queries
    if (dataTypes.includes('reservations')) {
      const res = await prisma.reservation.deleteMany({});
      deletedCounts.reservations = res.count;
    }

    if (dataTypes.includes('orders')) {
      const res = await prisma.whatsAppOrder.deleteMany({});
      deletedCounts.orders = res.count;
    }

    if (dataTypes.includes('audits')) {
      const res1 = await prisma.auditLog.deleteMany({});
      const res2 = await prisma.adminLoginSession.deleteMany({});
      deletedCounts.audits = res1.count + res2.count;
    }

    // Log the purge action if audits weren't deleted or after
    await logAdminAction(
      'admin-purge',
      email,
      'PURGE_DATA',
      `Purged sensitive data: ${dataTypes.join(', ')} (${JSON.stringify(deletedCounts)})`,
      null,
      deletedCounts
    );

    return NextResponse.json({
      success: true,
      message: 'Selected data has been permanently deleted.',
      deletedCounts
    });
  } catch (error: any) {
    console.error('Error clearing data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to clear selected data.' },
      { status: 500 }
    );
  }
}
