import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSessionUser, logAdminAction } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Headers that prevent ALL caching layers (Vercel Edge, CDN, browser) from caching this response.
const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
};

import { GALLERY_PHOTOS } from '@/utils/menuData';

function getDefaultGallery() {
  const photos = GALLERY_PHOTOS.map((p, i) => ({
    id: p.id || `photo-${i}`,
    src: p.src,
    title: p.title,
    menuCategory: p.menuCategory || null,
    menuDishName: p.menuDishName || null,
    order: i,
    altText: p.title,
    isFeatured: i < 6,
    albumName: 'General',
  }));
  const albums = Array.from(new Set(photos.map((p) => p.albumName)));
  return { photos, albums };
}

async function fetchGalleryFromSupabase() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!url || !key) return getDefaultGallery();
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(url, key);

    const { data } = await supabase.from('gallery_photos').select('*').order('order', { ascending: true });
    if (!data || data.length === 0) return getDefaultGallery();

    const photos = data.map((p: any) => ({
      id: p.id,
      src: p.src,
      title: p.title,
      menuCategory: p.menu_category || p.menuCategory || null,
      menuDishName: p.menu_dish_name || p.menuDishName || null,
      order: p.order ?? 0,
      altText: p.alt_text || p.altText || p.title,
      isFeatured: p.is_featured ?? p.isFeatured ?? false,
      albumName: p.album_name || p.albumName || 'General',
    }));

    const albums = Array.from(new Set(photos.map(p => p.albumName)));

    return { photos, albums };
  } catch {
    return getDefaultGallery();
  }
}

// GET /api/cms/gallery
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const isFeatured = searchParams.get('featured') === 'true';
    const albumName = searchParams.get('album') || '';

    let photos: any[] = [];
    let albums: string[] = [];

    try {
      const where: any = {};
      if (isFeatured) where.isFeatured = true;
      if (albumName) where.albumName = albumName;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { menuDishName: { contains: search, mode: 'insensitive' } },
          { menuCategory: { contains: search, mode: 'insensitive' } },
        ];
      }

      photos = await prisma.galleryPhoto.findMany({
        where,
        orderBy: { order: 'asc' },
      });

      const albumData = await prisma.galleryPhoto.findMany({
        select: { albumName: true },
        distinct: ['albumName'],
      });
      albums = albumData.map(a => a.albumName);
    } catch {
      const fallback = await fetchGalleryFromSupabase();
      photos = fallback.photos;
      albums = fallback.albums;
    }

    return NextResponse.json({ 
      success: true, 
      photos, 
      albums
    }, { headers: noCacheHeaders });
  } catch (error: any) {
    const fallback = await fetchGalleryFromSupabase();
    return NextResponse.json({ success: true, photos: fallback.photos, albums: fallback.albums }, { headers: noCacheHeaders });
  }
}

// POST /api/cms/gallery
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.src || !body.title) {
      return NextResponse.json({ success: false, error: 'Missing source URL or title' }, { status: 400 });
    }

    const photo = await prisma.galleryPhoto.create({
      data: {
        src: body.src,
        title: body.title,
        menuCategory: body.menuCategory || null,
        menuDishName: body.menuDishName || null,
        order: body.order ?? 0,
        altText: body.altText || body.title,
        isFeatured: body.isFeatured ?? false,
        albumName: body.albumName || 'General',
      }
    });

    await logAdminAction(user.id, user.email, 'ADD_GALLERY_PHOTO', `Photo: ${photo.title}`, null, photo);
    await Promise.all([revalidatePath('/gallery'), revalidatePath('/'), (revalidateTag as any)('gallery')]);

    return NextResponse.json({ success: true, photo }, { headers: noCacheHeaders });
  } catch (error: any) {
    console.error('Error creating gallery photo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/cms/gallery
// Supports single updates AND bulk update (for reordering).
export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Check if bulk reorder
    if (body.bulk && Array.isArray(body.items)) {
      const updates = body.items.map((item: { id: string; order: number }) =>
        prisma.galleryPhoto.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      );
      
      await Promise.all(updates);
      await logAdminAction(user.id, user.email, 'REORDER_GALLERY', `Reordered ${updates.length} items`, null, null);
      await Promise.all([revalidatePath('/gallery'), revalidatePath('/'), (revalidateTag as any)('gallery')]);
      
      return NextResponse.json({ success: true, message: 'Reordered successfully' }, { headers: noCacheHeaders });
    }

    // Normal update
    const { id, data } = body;
    if (!id || !data) {
      return NextResponse.json({ success: false, error: 'Missing photo ID or update data' }, { status: 400 });
    }

    const oldVal = await prisma.galleryPhoto.findUnique({ where: { id } });
    if (!oldVal) {
      return NextResponse.json({ success: false, error: 'Photo not found' }, { status: 404 });
    }

    const photo = await prisma.galleryPhoto.update({
      where: { id },
      data: {
        src: data.src,
        title: data.title,
        menuCategory: data.menuCategory,
        menuDishName: data.menuDishName,
        order: data.order,
        altText: data.altText,
        isFeatured: data.isFeatured,
        albumName: data.albumName,
      }
    });

    await logAdminAction(user.id, user.email, 'UPDATE_GALLERY_PHOTO', `Photo: ${photo.title}`, oldVal, photo);
    await Promise.all([revalidatePath('/gallery'), revalidatePath('/'), (revalidateTag as any)('gallery')]);

    return NextResponse.json({ success: true, photo }, { headers: noCacheHeaders });
  } catch (error: any) {
    console.error('Error updating gallery:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/cms/gallery
export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing photo ID' }, { status: 400 });
    }

    const photo = await prisma.galleryPhoto.findUnique({ where: { id } });
    if (!photo) {
      return NextResponse.json({ success: false, error: 'Photo not found' }, { status: 404 });
    }

    await prisma.galleryPhoto.delete({ where: { id } });

    await logAdminAction(user.id, user.email, 'DELETE_GALLERY_PHOTO', `Photo: ${photo.title}`, photo, null);
    await Promise.all([revalidatePath('/gallery'), revalidatePath('/'), (revalidateTag as any)('gallery')]);

    return NextResponse.json({ success: true, message: 'Photo deleted successfully' }, { headers: noCacheHeaders });
  } catch (error: any) {
    console.error('Error deleting gallery photo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
