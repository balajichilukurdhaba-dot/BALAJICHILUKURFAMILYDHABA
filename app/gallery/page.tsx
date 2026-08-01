import { GalleryPage } from '../../src/views/GalleryPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Photo Gallery & Restaurant Ambience',
  description:
    'Explore photos of our dhaba ambience, private family dining booths, exterior views, and signature pure vegetarian dishes.',
};

export default function GalleryRoute() {
  return <GalleryPage />;
}

