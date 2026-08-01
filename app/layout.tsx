import '../src/index.css';
import LayoutWrapper from './LayoutWrapper';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://bcfdfinal2026.vercel.app'),
  title: {
    default: 'Balaji Chilkur Family Dhaba | Pure Veg Restaurant in Hyderabad & Moinabad',
    template: '%s | Balaji Chilkur Family Dhaba',
  },
  description:
    'Experience authentic Pure Vegetarian North & South Indian cuisine at Balaji Chilkur Family Dhaba near Chilkur Balaji Temple, Moinabad & Hyderabad. Family dining, Biryani, Naan, Paneer specials, table reservations & online ordering.',
  keywords: [
    'Balaji Chilkur Family Dhaba',
    'Chilkur Balaji Dhaba',
    'Pure Veg Dhaba Hyderabad',
    'Best Veg Dhaba Moinabad',
    'Family Dhaba Hyderabad',
    'Chilkur Balaji Temple food',
    'North Indian Veg Restaurant',
    'Paneer Butter Masala Moinabad',
    'Dhaba near me Moinabad',
    'Hyderabad Veg Family Restaurant',
  ],
  authors: [{ name: 'Balaji Chilkur Family Dhaba' }],
  creator: 'Balaji Chilkur Family Dhaba',
  publisher: 'Balaji Chilkur Family Dhaba',
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://bcfdfinal2026.vercel.app',
    title: 'Balaji Chilkur Family Dhaba | Pure Veg Restaurant in Hyderabad & Moinabad',
    description:
      'Authentic Pure Vegetarian North & South Indian Dhaba near Chilkur Balaji Temple. Reserve tables, browse menu, and order online.',
    siteName: 'Balaji Chilkur Family Dhaba',
    images: [
      {
        url: '/dhaba-exterior.jpg',
        width: 1200,
        height: 630,
        alt: 'Balaji Chilkur Family Dhaba Entrance',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Balaji Chilkur Family Dhaba | Pure Veg Restaurant',
    description:
      'Authentic Pure Vegetarian North & South Indian Dhaba near Chilkur Balaji Temple.',
    images: ['/dhaba-exterior.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'Balaji Chilkur Family Dhaba',
  image: 'https://bcfdfinal2026.vercel.app/dhaba-exterior.jpg',
  '@id': 'https://bcfdfinal2026.vercel.app',
  url: 'https://bcfdfinal2026.vercel.app',
  telephone: '+91 99890 00000',
  priceRange: '₹₹',
  servesCuisine: ['North Indian', 'South Indian', 'Pure Vegetarian', 'Dhaba'],
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Chilkur Balaji Temple Road, Moinabad',
    addressLocality: 'Hyderabad',
    addressRegion: 'Telangana',
    postalCode: '501504',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 17.3621,
    longitude: 78.2917,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '11:00',
      closes: '23:00',
    },
  ],
  acceptsReservations: 'True',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex flex-col min-h-screen bg-brand-bg noise-overlay selection:bg-brand-accent selection:text-[#FFFFFF]">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}

