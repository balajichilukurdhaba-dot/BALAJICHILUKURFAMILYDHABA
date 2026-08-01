import React from 'react';
import ReserveClient from './ReserveClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Table Reservation & 10% Discount Voucher',
  description:
    'Reserve a dining table online at Balaji Chilkur Family Dhaba. Skip the waiting line and instantly get a 10% discount QR voucher for your visit.',
};

export default function ReservePage() {
  return <ReserveClient />;
}

