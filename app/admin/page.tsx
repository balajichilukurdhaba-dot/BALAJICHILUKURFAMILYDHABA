import React from 'react';
import prisma from '@/lib/prisma';
import { 
  Users, Calendar as CalendarIcon, CheckCircle2, Clock, ArrowRight, 
  UtensilsCrossed, MessageSquare, Mail, ShieldCheck, ChevronRight 
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalReservations = 0;
  let todayReservations = 0;
  let verifiedDiscounts = 0;
  let dishCount = 0;
  let photoCount = 0;
  let pendingTestimonials = 0;
  let messageCount = 0;
  let recentReservations: any[] = [];

  try {
    const res = await Promise.all([
      prisma.reservation.count().catch(() => 0),
      prisma.reservation.count({
        where: {
          date: {
            gte: today,
          }
        }
      }).catch(() => 0),
      prisma.reservation.count({
        where: {
          discountVerified: true
        }
      }).catch(() => 0),
      prisma.dish.count().catch(() => 0),
      prisma.galleryPhoto.count().catch(() => 0),
      prisma.testimonial.count({
        where: { isApproved: false }
      }).catch(() => 0),
      prisma.contactMessage.count().catch(() => 0),
      prisma.reservation.findMany({
        orderBy: [
          { date: 'desc' },
          { time: 'desc' }
        ],
        take: 5
      }).catch(() => [])
    ]);

    [
      totalReservations,
      todayReservations,
      verifiedDiscounts,
      dishCount,
      photoCount,
      pendingTestimonials,
      messageCount,
      recentReservations
    ] = res;
  } catch {
    // Silent catch
  }

  // If counters are all 0, fallback to querying via Supabase REST API
  if (totalReservations === 0 && dishCount === 0 && photoCount === 0) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      if (url && key) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(url, key);

        const [
          resTotal,
          resToday,
          resVerified,
          resDishes,
          resPhotos,
          resTestimonials,
          resMessages,
          resRecent
        ] = await Promise.all([
          supabase.from('reservations').select('*', { count: 'exact', head: true }),
          supabase.from('reservations').select('*', { count: 'exact', head: true }).gte('date', today.toISOString()),
          supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('discount_verified', true),
          supabase.from('dishes').select('*', { count: 'exact', head: true }),
          supabase.from('gallery_photos').select('*', { count: 'exact', head: true }),
          supabase.from('testimonials').select('*', { count: 'exact', head: true }).eq('is_approved', false),
          supabase.from('contact_messages').select('*', { count: 'exact', head: true }),
          supabase.from('reservations').select('*').order('date', { ascending: false }).limit(5)
        ]);

        totalReservations = resTotal.count || 0;
        todayReservations = resToday.count || 0;
        verifiedDiscounts = resVerified.count || 0;
        dishCount = resDishes.count || 0;
        photoCount = resPhotos.count || 0;
        pendingTestimonials = resTestimonials.count || 0;
        messageCount = resMessages.count || 0;
        if (resRecent.data) {
          recentReservations = resRecent.data.map((r: any) => ({
            id: r.id,
            bookingRef: r.booking_ref || r.bookingRef || '',
            customerName: r.customer_name || r.customerName || '',
            phone: r.phone || '',
            date: new Date(r.date || Date.now()),
            time: r.time || '',
            guests: r.guests || 1,
            discountVerified: r.discount_verified ?? r.discountVerified ?? false
          }));
        }
      }
    } catch {
      // Ignore
    }
  }

  // If dishCount or photoCount is still 0, fallback to default static dataset counts
  if (dishCount === 0) {
    const { SIGNATURE_DISHES } = await import('@/utils/menuData');
    dishCount = SIGNATURE_DISHES.length;
  }
  if (photoCount === 0) {
    const { GALLERY_PHOTOS } = await import('@/utils/menuData');
    photoCount = GALLERY_PHOTOS.length;
  }

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full">
      {/* Executive Welcome Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operational Online
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-2">Executive Overview</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time metrics and operational status for Balaji Dhaba.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/scanner" 
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>QR Voucher Verification</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Primary Interactive KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Link 
          href="/admin/reservations" 
          className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-1 transition-all duration-200 cursor-pointer group flex items-center justify-between min-w-0"
        >
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="p-2.5 sm:p-3 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-all duration-200 shrink-0">
              <Clock size={20} className="group-hover:scale-110 transition-transform duration-200" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 truncate group-hover:text-slate-900 transition-colors">Today's Bookings</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{todayReservations}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link 
          href="/admin/reservations" 
          className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-1 transition-all duration-200 cursor-pointer group flex items-center justify-between min-w-0"
        >
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="p-2.5 sm:p-3 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-all duration-200 shrink-0">
              <Users size={20} className="group-hover:scale-110 transition-transform duration-200" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 truncate group-hover:text-slate-900 transition-colors">Total Reservations</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{totalReservations}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link 
          href="/admin/checkout" 
          className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-1 transition-all duration-200 cursor-pointer group flex items-center justify-between min-w-0 sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="p-2.5 sm:p-3 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200 shrink-0">
              <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform duration-200" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 truncate group-hover:text-slate-900 transition-colors">Verified Vouchers</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{verifiedDiscounts}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* System Modules Interactive Cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">System Modules</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            href="/admin/menu" 
            className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex items-center justify-between group min-w-0 cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-all duration-200 shrink-0">
                <UtensilsCrossed size={18} className="group-hover:scale-110 transition-transform duration-200" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium text-slate-500 truncate group-hover:text-slate-900 transition-colors">Menu Dishes</span>
                <span className="font-semibold text-slate-900 text-sm truncate block">{dishCount} Items</span>
              </div>
            </div>
            <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link 
            href="/admin/gallery" 
            className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex items-center justify-between group min-w-0 cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-all duration-200 shrink-0">
                <CalendarIcon size={18} className="group-hover:scale-110 transition-transform duration-200" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium text-slate-500 truncate group-hover:text-slate-900 transition-colors">Gallery Media</span>
                <span className="font-semibold text-slate-900 text-sm truncate block">{photoCount} Assets</span>
              </div>
            </div>
            <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link 
            href="/admin/testimonials" 
            className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex items-center justify-between group min-w-0 cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-all duration-200 shrink-0">
                <MessageSquare size={18} className="group-hover:scale-110 transition-transform duration-200" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium text-slate-500 truncate group-hover:text-slate-900 transition-colors">Pending Reviews</span>
                <span className="font-semibold text-slate-900 text-sm truncate block">{pendingTestimonials} Reviews</span>
              </div>
            </div>
            <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link 
            href="/admin/messages" 
            className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex items-center justify-between group min-w-0 cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shrink-0">
                <Mail size={18} className="group-hover:scale-110 transition-transform duration-200" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium text-slate-500 truncate group-hover:text-slate-900 transition-colors">Inbox Queries</span>
                <span className="font-semibold text-slate-900 text-sm truncate block">{messageCount} Messages</span>
              </div>
            </div>
            <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>

      {/* Recent Reservations Table with Row Hovers */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-sm text-slate-900">Recent Booking Requests</h2>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Live stream of customer table reservations</p>
          </div>
          <Link 
            href="/admin/reservations" 
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline transition-all shrink-0"
          >
            View Console →
          </Link>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 bg-slate-50">
                <th className="px-4 sm:px-5 py-3">Booking Ref</th>
                <th className="px-4 sm:px-5 py-3">Customer Details</th>
                <th className="px-4 sm:px-5 py-3">Schedule</th>
                <th className="px-4 sm:px-5 py-3">Party Size</th>
                <th className="px-4 sm:px-5 py-3">Voucher Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-xs">
              {recentReservations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 font-medium">No recent bookings found.</td>
                </tr>
              ) : (
                recentReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-100/70 transition-colors cursor-pointer">
                    <td className="px-4 sm:px-5 py-3.5 font-mono font-semibold text-slate-900">{res.bookingRef}</td>
                    <td className="px-4 sm:px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{res.customerName}</div>
                      <div className="text-[11px] text-slate-500">{res.phone}</div>
                    </td>
                    <td className="px-4 sm:px-5 py-3.5 text-slate-700">
                      <div className="font-medium" suppressHydrationWarning>{new Date(res.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div className="text-[11px] text-slate-500">{res.time}</div>
                    </td>
                    <td className="px-4 sm:px-5 py-3.5 font-medium text-slate-900">{res.guests} Guests</td>
                    <td className="px-4 sm:px-5 py-3.5">
                      {res.discountVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold rounded-md">
                          <CheckCircle2 size={11} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold rounded-md">
                          <Clock size={11} /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
