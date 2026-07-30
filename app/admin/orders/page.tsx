import React from 'react';
import prisma from '@/lib/prisma';
import ClientOrdersDashboard from './ClientOrdersDashboard';

export const dynamic = 'force-dynamic';

export default async function OrdersDashboard() {
  try {
    // Fetch raw orders database logs
    const orders = await prisma.whatsAppOrder.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Serialize complex Prisma types (Dates and Decimals) to primitive types for the Client Component
    const serializedOrders = orders.map((order) => ({
      id: order.id,
      orderRef: order.orderRef,
      customerName: order.customerName,
      phone: order.phone,
      items: order.items,
      total: order.total ? order.total.toString() : '0',
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    }));

    return <ClientOrdersDashboard initialOrders={serializedOrders} />;
  } catch (error: any) {
    console.error('Database connection error in OrdersDashboard:', error.message || error);
    return (
      <ClientOrdersDashboard 
        initialOrders={[]} 
        dbError="Can't reach the Supabase database. Please check your network connection or verify if your Supabase project is active/unpaused." 
      />
    );
  }
}
