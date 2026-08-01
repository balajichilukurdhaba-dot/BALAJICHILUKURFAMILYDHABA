import { Menu } from '../../src/views/Menu';
import { Suspense } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Full Menu Catalog & Telugu Specialties',
  description:
    'Browse our complete pure vegetarian menu: Veg Biryanis, Paneer Specialties, Tandoori Naan, Soups, Starters & Family Combos at Balaji Chilkur Family Dhaba.',
};

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading menu catalog...</div>}>
      <Menu />
    </Suspense>
  );
}

