import { ContactPage } from '../../src/views/ContactPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us & Locations | Moinabad & Pragathi Nagar',
  description:
    'Get directions, phone numbers, opening hours, and contact details for Balaji Chilkur Family Dhaba branches at Moinabad & Pragathi Nagar, Hyderabad.',
};

export default function ContactRoute() {
  return <ContactPage />;
}

