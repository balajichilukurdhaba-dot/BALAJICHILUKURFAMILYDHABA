import React from 'react';
import prisma from '@/lib/prisma';
import { 
  Users, Calendar as CalendarIcon, CheckCircle2, Clock, ArrowRight, 
  UtensilsCrossed, MessageSquare, Mail, ShieldCheck 
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalReservations,
    todayReservations,
    verifiedDiscounts,
    dishCount,
    photoCount,
    pendingTestimonials,
    messageCount,
    recentReservations
  ] = await Promise.all([
    prisma.reservation.count(),
    prisma.reservation.count({
      where: {
        date: {
          gte: today,
        }
      }
    }),
    prisma.reservation.count({
      where: {
        discountVerified: true
      }
    }),
    prisma.dish.count(),
    prisma.galleryPhoto.count(),
    prisma.testimonial.count({
      where: { isApproved: false }
    }),
    prisma.contactMessage.count(),
    prisma.reservation.findMany({
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ],
      take: 5
    })
  ]);

  return (
    <div className="space-y-8">
      {/* Executive Welcome Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operational Online
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">Executive Overview</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time metrics and operational status for Balaji Dhaba.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/scanner" 
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <span>QR Voucher Verification</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-slate-100 text-slate-700">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Today's Bookings</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{todayReservations}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-slate-100 text-slate-700">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Reservations</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalReservations}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Verified Vouchers</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{verifiedDiscounts}</p>
          </div>
        </div>
      </div>

      {/* System Modules Quick Metrics */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">System Modules</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/menu" className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 shadow-sm flex items-center gap-3.5 transition-colors group">
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-200 transition-colors">
              <UtensilsCrossed size={18} />
            </div>
            <div>
              <span className="block text-[11px] font-medium text-slate-500">Menu Dishes</span>
              <span className="font-semibold text-slate-900 text-sm">{dishCount} Items</span>
            </div>
          </Link>

          <Link href="/admin/gallery" className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 shadow-sm flex items-center gap-3.5 transition-colors group">
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-200 transition-colors">
              <CalendarIcon size={18} />
            </div>
            <div>
              <span className="block text-[11px] font-medium text-slate-500">Gallery Media</span>
              <span className="font-semibold text-slate-900 text-sm">{photoCount} Assets</span>
            </div>
          </Link>

          <Link href="/admin/testimonials" className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 shadow-sm flex items-center gap-3.5 transition-colors group">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700">
              <MessageSquare size={18} />
            </div>
            <div>
              <span className="block text-[11px] font-medium text-slate-500">Pending Reviews</span>
              <span className="font-semibold text-slate-900 text-sm">{pendingTestimonials} Reviews</span>
            </div>
          </Link>

          <Link href="/admin/messages" className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 shadow-sm flex items-center gap-3.5 transition-colors group">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700">
              <Mail size={18} />
            </div>
            <div>
              <span className="block text-[11px] font-medium text-slate-500">Inbox Queries</span>
              <span className="font-semibold text-slate-900 text-sm">{messageCount} Messages</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Reservations Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm text-slate-900">Recent Booking Requests</h2>
            <p className="text-xs text-slate-500 mt-0.5">Live stream of customer table reservations</p>
          </div>
          <Link 
            href="/admin/reservations" 
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
          >
            View Console →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 bg-slate-50">
                <th className="px-5 py-3">Booking Ref</th>
                <th className="px-5 py-3">Customer Details</th>
                <th className="px-5 py-3">Schedule</th>
                <th className="px-5 py-3">Party Size</th>
                <th className="px-5 py-3">Voucher Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-xs">
              {recentReservations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 font-medium">No recent bookings found.</td>
                </tr>
              ) : (
                recentReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">{res.bookingRef}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{res.customerName}</div>
                      <div className="text-[11px] text-slate-500">{res.phone}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      <div className="font-medium">{res.date.toLocaleDateString()}</div>
                      <div className="text-[11px] text-slate-500">{res.time}</div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{res.guests} Guests</td>
                    <td className="px-5 py-3.5">
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
