import { AboutPage } from '../../src/views/AboutPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Story & Culinary Heritage',
  description:
    'Learn about Balaji Chilkur Family Dhaba’s legacy of authentic pure vegetarian dining, farm fresh ingredients, and traditional North & South Indian recipes since 1999.',
};

export default function AboutRoute() {
  return <AboutPage />;
}

