import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSessionUser, logAdminAction } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function getYouTubeEmbedUrl(url: string) {
  if (!url) return '';
  
  let videoId = '';
  
  // Try to match shorts URL: https://youtube.com/shorts/RjOCcwlkJSA?si=...
  if (url.includes('/shorts/')) {
    const parts = url.split('/shorts/');
    if (parts[1]) {
      videoId = parts[1].split('?')[0];
    }
  }
  // Try to match watch URL: https://www.youtube.com/watch?v=RjOCcwlkJSA
  else if (url.includes('v=')) {
    const match = url.match(/[?&]v=([^&#]*)/);
    if (match && match[1]) {
      videoId = match[1];
    }
  }
  // Try to match share URL: https://youtu.be/RjOCcwlkJSA
  else if (url.includes('youtu.be/')) {
    const parts = url.split('youtu.be/');
    if (parts[1]) {
      videoId = parts[1].split('?')[0];
    }
  }
  // Try to match direct embed URL: https://www.youtube.com/embed/RjOCcwlkJSA
  else if (url.includes('/embed/')) {
    const parts = url.split('/embed/');
    if (parts[1]) {
      videoId = parts[1].split('?')[0];
    }
  }
  // If we only have the 11 character ID
  else if (url.length === 11) {
    videoId = url;
  }
  
  if (videoId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&playsinline=1&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&vq=hd1080`;
  }
  
  return url;
}

async function fetchHomepageFromSupabase() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!url || !key) return {};
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(url, key);

    const { data } = await supabase.from('site_settings').select('*');
    if (!data) return {};

    const map: any = {};
    data.forEach((s: any) => {
      try {
        map[s.key] = JSON.parse(s.value);
      } catch {
        map[s.key] = s.value;
      }
    });

    return map;
  } catch {
    return {};
  }
}

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
};

// GET /api/cms/homepage
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const draftMode = searchParams.get('draft') === 'true';

    // Verify session for draft mode
    let loadDraft = false;
    if (draftMode) {
      const user = await getSessionUser();
      if (user) loadDraft = true;
    }

    const settingsKeys = [
      'homepage_hero',
      'announcement_bar',
      'homepage_about',
      'homepage_sections',
      'seo_settings',
      'website_settings'
    ];

    let settings: any[] = [];
    try {
      settings = await prisma.siteSettings.findMany({
        where: { key: { in: settingsKeys } }
      });
    } catch {
      const fallbackMap = await fetchHomepageFromSupabase();
      return NextResponse.json({ success: true, settings: fallbackMap }, { headers: noCacheHeaders });
    }

    const settingsMap: any = {};
    
    // Default fallback values
    settingsMap.homepage_sections = {
      hero: true,
      announcement: true,
      featuredDishes: true,
      offers: true,
      about: true,
      gallery: true,
      testimonials: true,
      contact: true
    };

    settings.forEach(s => {
      try {
        const val = JSON.parse(s.value);
        if (s.key === 'homepage_hero' && !loadDraft) {
          settingsMap[s.key] = {
            title: val.title || val.draftTitle,
            subtitle: val.subtitle || val.draftSubtitle,
            videoUrl: val.videoUrl,
            ctaText: val.ctaText,
            ctaLink: val.ctaLink,
            secondaryCtaText: val.secondaryCtaText,
            secondaryCtaLink: val.secondaryCtaLink,
          };
        } else {
          settingsMap[s.key] = val;
        }
      } catch (e) {
        settingsMap[s.key] = s.value;
      }
    });

    return NextResponse.json({ success: true, settings: settingsMap }, { headers: noCacheHeaders });
  } catch (error: any) {
    const fallbackMap = await fetchHomepageFromSupabase();
    return NextResponse.json({ success: true, settings: fallbackMap }, { headers: noCacheHeaders });
  }
}

// POST /api/cms/homepage
// Protected (admin/staff only)
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Support compound homepage settings saving/publishing
    if (body.action) {
      const isPublish = body.action === 'publish';

      // 1. Process Hero settings
      const heroVal = body.homepage_hero || {};
      const oldHeroSetting = await prisma.siteSettings.findUnique({ where: { key: 'homepage_hero' } });
      const oldHero = oldHeroSetting ? JSON.parse(oldHeroSetting.value) : {};

      const newHero: any = {
        ...oldHero,
        videoUrl: getYouTubeEmbedUrl(heroVal.videoUrl),
        ctaText: heroVal.ctaText,
        ctaLink: heroVal.ctaLink,
        secondaryCtaText: heroVal.secondaryCtaText,
        secondaryCtaLink: heroVal.secondaryCtaLink,
        draftTitle: heroVal.title,
        draftSubtitle: heroVal.subtitle,
        title: heroVal.title,
        subtitle: heroVal.subtitle,
        isPublished: true
      };

      await prisma.siteSettings.upsert({
        where: { key: 'homepage_hero' },
        update: { value: JSON.stringify(newHero) },
        create: { key: 'homepage_hero', value: JSON.stringify(newHero) }
      });

      // 2. Process other settings
      const otherKeys = ['announcement_bar', 'homepage_about', 'homepage_sections'];
      for (const k of otherKeys) {
        if (body[k] !== undefined) {
          await prisma.siteSettings.upsert({
            where: { key: k },
            update: { value: JSON.stringify(body[k]) },
            create: { key: k, value: JSON.stringify(body[k]) }
          });
        }
      }

      await logAdminAction(
        user.id,
        user.email,
        'UPDATE_HOMEPAGE_CMS',
        `Action: ${body.action}`,
        null,
        body
      );

      try {
        revalidatePath('/');
        revalidatePath('/about');
        revalidatePath('/menu');
        revalidatePath('/admin/homepage');
      } catch (e) {
        console.error(e);
      }

      return NextResponse.json({ success: true, settings: body }, { headers: noCacheHeaders });
    }

    // Fallback: singular key-value updates
    const { key, value } = body;
    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: 'Missing key or value' }, { status: 400 });
    }

    const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);

    const oldSetting = await prisma.siteSettings.findUnique({ where: { key } });
    const oldParsed = oldSetting ? JSON.parse(oldSetting.value) : null;

    const setting = await prisma.siteSettings.upsert({
      where: { key },
      update: { value: valueStr },
      create: { key, value: valueStr }
    });

    await logAdminAction(
      user.id,
      user.email,
      'UPDATE_HOMEPAGE_SETTING',
      `Setting: ${key}`,
      oldParsed,
      value
    );

    revalidatePath('/');
    revalidatePath('/about');

    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    console.error('Error updating homepage CMS settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
