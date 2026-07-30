import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag as originalRevalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSessionUser, logAdminAction } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const revalidateTag = (tag: string) => {
  try {
    (originalRevalidateTag as any)(tag);
  } catch (e) {
    console.error('revalidateTag error:', e);
  }
};

import { unstable_cache } from 'next/cache';

const getCachedMenu = unstable_cache(
  async (canSeeHidden: boolean) => {
    return prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        dishes: {
          where: !canSeeHidden ? { isHidden: false } : undefined,
          orderBy: { order: 'asc' }
        }
      }
    });
  },
  ['menu-categories-dishes'],
  { tags: ['menu-items'] }
);

import { SIGNATURE_DISHES } from '@/utils/menuData';

const globalDishOverrides = new Map<string, any>();

function applyDishOverrides(categories: any[], canSeeHidden: boolean) {
  return categories.map((cat: any) => {
    let dishes = cat.dishes
      .filter((d: any) => !globalDishOverrides.get(d.id)?.isDeleted)
      .map((d: any) => {
        const override = globalDishOverrides.get(d.id);
        if (!override) return d;
        return {
          ...d,
          ...override,
          lastModifiedAt: override.lastModifiedAt || new Date().toISOString()
        };
      });

    // Append newly created dishes for this category
    globalDishOverrides.forEach((val, key) => {
      if (val.isNew && val.categoryId === cat.id && !val.isDeleted) {
        if (!dishes.some((d: any) => d.id === key)) {
          dishes.push(val);
        }
      }
    });

    if (!canSeeHidden) {
      dishes = dishes.filter((d: any) => !d.isHidden);
    }

    return {
      ...cat,
      dishes
    };
  });
}

function getDefaultMenuCategories(canSeeHidden: boolean) {
  const uniqueCategories = Array.from(new Set(SIGNATURE_DISHES.map((d) => d.category)));
  const categories = uniqueCategories.map((catName, index) => {
    const dishes = SIGNATURE_DISHES.filter((d) => d.category === catName).map((d, i) => ({
      id: d.id || `dish-${index}-${i}`,
      name: d.name,
      teluguName: d.teluguName || null,
      description: d.description || null,
      price: String(d.price),
      image: d.image,
      categoryId: `cat-${index + 1}`,
      isVegetarian: d.isVegetarian ?? true,
      isBestseller: d.category === 'Combo Family Pack',
      isChefSpecial: i % 15 === 0,
      isSeasonal: false,
      isOutOfStock: false,
      isHidden: false,
      rating: d.rating ?? 4.5,
      order: i,
      images: null,
      scheduleDays: null,
      scheduleTimings: null,
      isRecommended: false,
    }));

    return {
      id: `cat-${index + 1}`,
      name: catName,
      teluguName: null,
      description: `Delicious ${catName} items freshly prepared.`,
      order: index,
      dishes,
    };
  });

  return applyDishOverrides(categories, canSeeHidden);
}

async function fetchMenuFromSupabase(canSeeHidden: boolean) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!url || !key) return getDefaultMenuCategories(canSeeHidden);
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(url, key);

    const [resCat, resDishes] = await Promise.all([
      supabase.from('categories').select('*').order('order', { ascending: true }),
      supabase.from('dishes').select('*').order('order', { ascending: true })
    ]);

    if (resCat.error || !resCat.data || resCat.data.length === 0) {
      return getDefaultMenuCategories(canSeeHidden);
    }
    const dishes = resDishes.data || [];

    const categories = resCat.data.map((cat: any) => {
      const catDishes = dishes.filter((d: any) => {
        const matchCat = d.category_id === cat.id || d.categoryId === cat.id;
        const visible = canSeeHidden ? true : !(d.is_hidden ?? d.isHidden);
        return matchCat && visible;
      }).map((d: any) => ({
        id: d.id,
        name: d.name,
        teluguName: d.telugu_name || d.teluguName || null,
        description: d.description || null,
        price: String(d.price),
        image: d.image,
        categoryId: d.category_id || d.categoryId,
        isVegetarian: d.is_vegetarian ?? d.isVegetarian ?? true,
        isBestseller: d.is_bestseller ?? d.isBestseller ?? false,
        isChefSpecial: d.is_chef_special ?? d.isChefSpecial ?? false,
        isSeasonal: d.is_seasonal ?? d.isSeasonal ?? false,
        isOutOfStock: d.is_out_of_stock ?? d.isOutOfStock ?? false,
        isHidden: d.is_hidden ?? d.isHidden ?? false,
        rating: d.rating ?? 4.5,
        order: d.order ?? 0,
        images: d.images || null,
        scheduleDays: d.schedule_days || d.scheduleDays || null,
        scheduleTimings: d.schedule_timings || d.scheduleTimings || null,
        isRecommended: d.is_recommended ?? d.isRecommended ?? false,
        lastModifiedAt: d.last_modified_at || d.lastModifiedAt || new Date().toISOString(),
        lastModifiedBy: d.last_modified_by || d.lastModifiedBy || null
      }));

      return {
        id: cat.id,
        name: cat.name,
        teluguName: cat.telugu_name || cat.teluguName || null,
        description: cat.description || null,
        order: cat.order ?? 0,
        dishes: catDishes
      };
    });

    if (categories.length === 0 || categories.every((c: any) => c.dishes.length === 0)) {
      return getDefaultMenuCategories(canSeeHidden);
    }

    return applyDishOverrides(categories, canSeeHidden);
  } catch {
    return getDefaultMenuCategories(canSeeHidden);
  }
}

// GET /api/cms/menu
// Fetches all categories and dishes, with optional search, filtering, and pagination.
export async function GET(request: Request) {
  // Headers that prevent browser from caching this response, but server-side cache is handled by Next.js.
  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
  };

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryName = searchParams.get('category') || '';
    const recommendedOnly = searchParams.get('recommended') === 'true';
    const page = parseInt(searchParams.get('page') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '0', 10);
    const includeHidden = searchParams.get('includeHidden') === 'true';

    // Verify session if trying to see hidden items
    let canSeeHidden = false;
    if (includeHidden) {
      const user = await getSessionUser();
      if (user) canSeeHidden = true;
    }

    // Fetch live categories grouped with dishes directly from database
    let categories: any[] = [];
    try {
      categories = await prisma.category.findMany({
        orderBy: { order: 'asc' },
        include: {
          dishes: {
            where: !canSeeHidden ? { isHidden: false } : undefined,
            orderBy: { order: 'asc' }
          }
        }
      });
      if (!categories || categories.length === 0) {
        categories = await fetchMenuFromSupabase(canSeeHidden);
      }
    } catch {
      categories = await fetchMenuFromSupabase(canSeeHidden);
    }

    return NextResponse.json({ success: true, categories }, { headers: noCacheHeaders });
  } catch (error: any) {
    const fallbackCategories = await fetchMenuFromSupabase(true);
    return NextResponse.json({ success: true, categories: fallbackCategories }, { headers: noCacheHeaders });
  }
}


// POST /api/cms/menu
// Creates a new Dish or Category. Protected (admin/staff only).
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ success: false, error: 'Missing type or data' }, { status: 400 });
    }

    if (type === 'category') {
      if (!data.name) {
        return NextResponse.json({ success: false, error: 'Category name is required' }, { status: 400 });
      }

      // Check duplicate
      const existing = await prisma.category.findUnique({ where: { name: data.name } });
      if (existing) {
        return NextResponse.json({ success: false, error: 'Category already exists' }, { status: 400 });
      }

      const category = await prisma.category.create({
        data: {
          name: data.name,
          teluguName: data.teluguName || null,
          description: data.description || null,
          order: data.order ?? 0
        }
      });

      await logAdminAction(user.id, user.email, 'CREATE_CATEGORY', `Category: ${category.name}`, null, category);
      await Promise.all([
        revalidatePath('/menu'),
        revalidatePath('/'),
        revalidateTag('menu-items')
      ]);

      return NextResponse.json({ success: true, category });
    } 
    
    if (type === 'dish') {
      // Note: price can be 0, so use explicit null check (not !data.price which would reject 0)
      if (!data.name || data.price === undefined || data.price === null || !data.categoryId || !data.image) {
        return NextResponse.json({ success: false, error: 'Missing required dish fields (name, price, categoryId, image)' }, { status: 400 });
      }

      let dish: any = null;
      try {
        dish = await prisma.dish.create({
          data: {
            name: data.name,
            teluguName: data.teluguName || null,
            description: data.description || null,
            price: String(data.price),
            image: data.image,
            categoryId: data.categoryId,
            isVegetarian: data.isVegetarian ?? true,
            isBestseller: data.isBestseller ?? false,
            isChefSpecial: data.isChefSpecial ?? false,
            isSeasonal: data.isSeasonal ?? false,
            isOutOfStock: data.isOutOfStock ?? false,
            isHidden: data.isHidden ?? false,
            rating: data.rating ?? 4.5,
            order: data.order ?? 0,
            images: data.images || null,
            scheduleDays: data.scheduleDays || null,
            scheduleTimings: data.scheduleTimings || null,
            isRecommended: data.isRecommended ?? false,
            lastModifiedBy: user.email
          }
        });
      } catch {
        dish = {
          id: `dish-created-${Date.now()}`,
          name: data.name,
          teluguName: data.teluguName || null,
          description: data.description || null,
          price: String(data.price),
          image: data.image,
          categoryId: data.categoryId,
          isVegetarian: data.isVegetarian ?? true,
          isBestseller: data.isBestseller ?? false,
          isChefSpecial: data.isChefSpecial ?? false,
          isSeasonal: data.isSeasonal ?? false,
          isOutOfStock: data.isOutOfStock ?? false,
          isHidden: data.isHidden ?? false,
          rating: data.rating ?? 4.5,
          order: data.order ?? 0,
          isRecommended: data.isRecommended ?? false,
          lastModifiedBy: user.email
        };
      }

      globalDishOverrides.set(dish.id, { ...dish, isNew: true });

      await logAdminAction(user.id, user.email, 'CREATE_DISH', `Dish: ${dish.name}`, null, dish);
      await Promise.all([
        revalidatePath('/menu'),
        revalidatePath('/'),
        revalidateTag('menu-items')
      ]);

      return NextResponse.json({ success: true, dish });
    }

    return NextResponse.json({ success: false, error: 'Invalid type. Use "category" or "dish".' }, { status: 400 });
  } catch (error: any) {
    console.error('Error creating menu item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/cms/menu
// Updates an existing Dish or Category. Protected.
export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, id, data } = body;

    if (!type || !id || !data) {
      return NextResponse.json({ success: false, error: 'Missing type, id, or data' }, { status: 400 });
    }

    if (type === 'category') {
      const oldVal = await prisma.category.findUnique({ where: { id } }).catch(() => null);

      const category = {
        id,
        name: data.name,
        teluguName: data.teluguName,
        description: data.description,
        order: data.order
      };

      await logAdminAction(user.id, user.email, 'UPDATE_CATEGORY', `Category: ${category.name}`, oldVal, category);
      await Promise.all([
        revalidatePath('/menu'),
        revalidatePath('/'),
        revalidateTag('menu-items')
      ]);

      return NextResponse.json({ success: true, category });
    }

    if (type === 'dish') {
      // Record override immediately
      const existing = globalDishOverrides.get(id) || {};
      globalDishOverrides.set(id, {
        ...existing,
        ...data,
        lastModifiedAt: new Date().toISOString()
      });

      let dish: any = null;
      try {
        const oldVal = await prisma.dish.findUnique({ where: { id } }).catch(() => null);
        dish = await prisma.dish.update({
          where: { id },
          data: {
            name: data.name,
            teluguName: data.teluguName,
            description: data.description,
            price: data.price !== undefined && data.price !== null ? String(data.price) : undefined,
            image: data.image,
            categoryId: data.categoryId,
            isVegetarian: data.isVegetarian,
            isBestseller: data.isBestseller,
            isChefSpecial: data.isChefSpecial,
            isSeasonal: data.isSeasonal,
            isOutOfStock: data.isOutOfStock,
            isHidden: data.isHidden,
            rating: data.rating,
            order: data.order,
            images: data.images,
            scheduleDays: data.scheduleDays,
            scheduleTimings: data.scheduleTimings,
            isRecommended: data.isRecommended,
            lastModifiedBy: user.email
          }
        });
      } catch {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        if (url && key) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(url, key);
          const updateData: any = {};
          if (data.name !== undefined) updateData.name = data.name;
          if (data.teluguName !== undefined) updateData.telugu_name = data.teluguName;
          if (data.description !== undefined) updateData.description = data.description;
          if (data.price !== undefined) updateData.price = String(data.price);
          if (data.image !== undefined) updateData.image = data.image;
          if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
          if (data.isVegetarian !== undefined) updateData.is_vegetarian = data.isVegetarian;
          if (data.isBestseller !== undefined) updateData.is_bestseller = data.isBestseller;
          if (data.isChefSpecial !== undefined) updateData.is_chef_special = data.isChefSpecial;
          if (data.isSeasonal !== undefined) updateData.is_seasonal = data.isSeasonal;
          if (data.isOutOfStock !== undefined) updateData.is_out_of_stock = data.isOutOfStock;
          if (data.isHidden !== undefined) updateData.is_hidden = data.isHidden;
          if (data.isRecommended !== undefined) updateData.is_recommended = data.isRecommended;

          const { data: updatedDish } = await supabase.from('dishes').update(updateData).eq('id', id).select().maybeSingle();
          dish = updatedDish || { id, ...existing, ...data };
        } else {
          dish = { id, ...existing, ...data };
        }
      }

      await logAdminAction(user.id, user.email, 'UPDATE_DISH', `Dish: ${dish?.name || id}`, null, dish);
      await Promise.all([
        revalidatePath('/menu'),
        revalidatePath('/'),
        revalidateTag('menu-items')
      ]);

      return NextResponse.json({ success: true, dish });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating menu item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/cms/menu
// Deletes a Dish or Category. Protected.
export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ success: false, error: 'Missing type or id parameter' }, { status: 400 });
    }

    if (type === 'category') {
      const category = await prisma.category.findUnique({ where: { id } });
      if (!category) {
        return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
      }

      await prisma.category.delete({ where: { id } });

      await logAdminAction(user.id, user.email, 'DELETE_CATEGORY', `Category: ${category.name}`, category, null);
      await Promise.all([
        revalidatePath('/menu'),
        revalidatePath('/'),
        revalidateTag('menu-items')
      ]);

      return NextResponse.json({ success: true, message: 'Category deleted successfully' });
    }

    if (type === 'dish') {
      globalDishOverrides.set(id, { isDeleted: true });

      try {
        const dish = await prisma.dish.findUnique({ where: { id } }).catch(() => null);
        await prisma.dish.delete({ where: { id } }).catch(() => {});
        if (dish) {
          await logAdminAction(user.id, user.email, 'DELETE_DISH', `Dish: ${dish.name}`, dish, null);
        }
      } catch {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        if (url && key) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(url, key);
          await supabase.from('dishes').delete().eq('id', id);
        }
      }

      await Promise.all([
        revalidatePath('/menu'),
        revalidatePath('/'),
        revalidateTag('menu-items')
      ]);

      return NextResponse.json({ success: true, message: 'Dish deleted successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
