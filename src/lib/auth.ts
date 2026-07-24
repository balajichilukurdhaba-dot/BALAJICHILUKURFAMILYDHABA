import { createClient } from '../utils/supabase/server';
import prisma from './prisma';
import { headers, cookies } from 'next/headers';

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'staff';
}

export async function getSessionUser(): Promise<AdminUser | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email) {
      // Check database role
      const dbRole = await prisma.adminUserRole.findUnique({
        where: { email: user.email }
      });

      if (dbRole) {
        return {
          id: user.id,
          email: user.email,
          role: dbRole.role as 'admin' | 'staff'
        };
      }

      // Fail-safe logic for seeding / initial admins / local testing
      return { id: user.id, email: user.email, role: 'admin' };
    }

    // Check admin_logged_in cookie fallback
    try {
      const cookieStore = await cookies();
      const adminCookie = cookieStore.get('admin_logged_in')?.value;
      if (adminCookie === 'true') {
        return {
          id: 'admin-session-local',
          email: 'admin@balajichilkur.com',
          role: 'admin'
        };
      }
    } catch {
      // Ignore cookie store errors outside request context
    }

    return null;
  } catch (error) {
    console.error('Error getting session user:', error);
    return null;
  }
}

export async function logAdminAction(
  userId: string,
  userEmail: string,
  action: string,
  target: string,
  prevValue?: any,
  newValue?: any
) {
  try {
    let ipAddress = '127.0.0.1';
    try {
      const headersList = await headers();
      ipAddress =
        headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headersList.get('x-real-ip') ||
        '127.0.0.1';
    } catch (hErr) {
      // headers() might fail outside of Next.js server requests (e.g. prisma seeding)
    }

    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action,
        target,
        details: target,
        ipAddress,
        prevValue: prevValue ? JSON.parse(JSON.stringify(prevValue)) : undefined,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
      }
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}
