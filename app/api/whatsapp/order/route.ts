import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, phone, items, total } = body;

    if (!phone || !items || !total) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const orderRef = 'ORD-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    const numericTotal = typeof total === 'number' 
      ? total 
      : parseFloat(String(total).replace(/[^0-9.]/g, '')) || 0;

    const order = await prisma.whatsAppOrder.create({
      data: {
        orderRef,
        customerName,
        phone,
        items,
        total: numericTotal,
        status: 'sent'
      }
    });

    return NextResponse.json({
      success: true,
      order,
      message: 'WhatsApp order saved successfully!'
    }, { status: 201 });

  } catch (error) {
    console.error('WhatsApp Order Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing order ID or status' }, { status: 400 });
    }

    const updatedOrder = await prisma.whatsAppOrder.update({
      where: { id },
      data: { status }
    });

    let whatsappLog = '';
    if (status === 'confirmed') {
      whatsappLog = `[WhatsApp Send] Mocked message sent to ${updatedOrder.phone}: "Hello ${updatedOrder.customerName || 'Customer'}, your order (${updatedOrder.orderRef}) has been confirmed and is now preparing!"`;
      console.log(whatsappLog);
    } else if (status === 'delivering') {
      whatsappLog = `[WhatsApp Send] Mocked message sent to ${updatedOrder.phone}: "Hello ${updatedOrder.customerName || 'Customer'}, your order (${updatedOrder.orderRef}) is out for delivery!"`;
      console.log(whatsappLog);
    } else if (status === 'completed') {
      whatsappLog = `[WhatsApp Send] Mocked message sent to ${updatedOrder.phone}: "Hello ${updatedOrder.customerName || 'Customer'}, your order (${updatedOrder.orderRef}) has been successfully delivered! Thank you for dining with Balaji Chilkur!"`;
      console.log(whatsappLog);
    } else if (status === 'cancelled') {
      whatsappLog = `[WhatsApp Send] Mocked message sent to ${updatedOrder.phone}: "Hello ${updatedOrder.customerName || 'Customer'}, your order (${updatedOrder.orderRef}) has been cancelled. Please contact us for details."`;
      console.log(whatsappLog);
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      whatsappLog
    });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
