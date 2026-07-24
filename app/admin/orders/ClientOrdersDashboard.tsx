'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, CheckCircle, Calendar, Phone, Search, X, RefreshCw, Truck, Ban, Check, AlertCircle, Clock, MapPin 
} from 'lucide-react';

interface Order {
  id: string;
  orderRef: string;
  customerName: string | null;
  phone: string;
  items: any; // array of items
  total: string;
  status: string;
  createdAt: string; // ISO string
}

interface ClientOrdersDashboardProps {
  initialOrders: Order[];
}

const WhatsAppIcon = ({ size = 15, className = "" }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={size} height={size} fill="currentColor" className={className}>
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L3.2 496l131.6-34.5c32.5 17.7 68.9 27 105.8 27 122.4 0 222-99.6 222-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-78.5 20.6 21-76.5-4.4-7.1c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
  </svg>
);

// Format names into proper Title Case
function formatTitleCase(str: string | null | undefined): string {
  if (!str || !str.trim()) return 'Walk-in Customer';
  return str
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Format Phone Numbers cleanly (+91 XXXXX XXXXX)
function formatPhoneNumber(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  } else if (clean.length === 12 && clean.startsWith('91')) {
    return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
  }
  return phone;
}

// Helper to get local date string (YYYY-MM-DD)
function getLocalDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
}

function getWhatsAppMessage(order: { orderRef: string; customerName: string | null; status: string; total: string }): string {
  const customer = formatTitleCase(order.customerName);
  const ref = order.orderRef;
  const total = order.total;
  const status = (order.status || '').toLowerCase();

  switch (status) {
    case 'confirmed':
      return `Hello ${customer},\n\nYour order *${ref}* (Total: ₹${total}) has been *CONFIRMED* by Balaji Chilkur Family Dhaba! 👨‍🍳🔥\nOur chef is preparing your delicious meal now. We will notify you once it is out for delivery.\n\nThank you for choosing us! 🍲`;

    case 'delivering':
    case 'out_for_delivery':
      return `Hello ${customer},\n\nGreat news! Your order *${ref}* is now *OUT FOR DELIVERY* 🛵💨\nOur delivery partner is on the way with your hot meal from Balaji Chilkur Family Dhaba.\n\nPlease keep ₹${total} ready if paying cash on delivery. Enjoy your food! 😋`;

    case 'completed':
    case 'delivered':
      return `Hello ${customer},\n\nYour order *${ref}* has been successfully *DELIVERED*! 🎉\nWe hope you enjoy your delicious meal from Balaji Chilkur Family Dhaba.\n\nPlease share your valuable feedback with us. Have a great day! 🙏✨`;

    case 'cancelled':
      return `Hello ${customer},\n\nWe regret to inform you that your order *${ref}* at Balaji Chilkur Family Dhaba has been *CANCELLED*. ❌\nIf you have any questions or would like to re-order, please reply directly to this message.\n\nWe apologize for any inconvenience caused. 🙏`;

    case 'sent':
    default:
      return `Hello ${customer},\n\nThank you for placing order *${ref}* (Total: ₹${total}) with Balaji Chilkur Family Dhaba! 🍽️\nWe have received your order details and are reviewing it right now. We will update you shortly.`;
  }
}

export default function ClientOrdersDashboard({ initialOrders }: ClientOrdersDashboardProps) {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>(initialOrders);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const handleUpdateOrderStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/whatsapp/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
        
        // Auto-open WhatsApp chat with status-tailored notification message
        const updatedOrd = orders.find(o => o.id === id);
        if (updatedOrd) {
          const targetOrd = { ...updatedOrd, status: newStatus };
          const cleanPhone = targetOrd.phone.replace(/\D/g, '');
          const formattedPhone = cleanPhone.startsWith('91') || cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;
          const msg = getWhatsAppMessage(targetOrd);
          const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
          window.open(waUrl, '_blank');
        }

        router.refresh();
      } else {
        alert(data.error || 'Failed to update order status');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating order status');
    }
  };

  const [todayValue, setTodayValue] = useState<string>(() => getLocalDateStr(0));
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateStr(0));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const calendarInputRef = useRef<HTMLInputElement>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh: fetch new orders from DB every 60 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      router.refresh();
    }, 60_000);
    return () => clearInterval(refreshInterval);
  }, [router]);

  // Midnight date-roll check
  useEffect(() => {
    const checkDateRoll = setInterval(() => {
      const newToday = getLocalDateStr(0);
      if (newToday !== todayValue) {
        setTodayValue(newToday);
        setSelectedDate((prev) => (prev === todayValue ? newToday : prev));
      }
    }, 60_000);
    return () => clearInterval(checkDateRoll);
  }, [todayValue]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Build 60-day scrollable date strip
  const recentDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 60; i++) {
      const d = new Date(todayValue + 'T00:00:00');
      d.setDate(d.getDate() - i);
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - offset * 60 * 1000);
      const value = local.toISOString().split('T')[0];

      let label = '';
      if (i === 0) label = 'Today';
      else if (i === 1) label = 'Yesterday';
      else label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

      days.push({ label, value });
    }
    return days;
  }, [todayValue]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Date filter
      if (selectedDate) {
        const orderDateStr = order.createdAt.split('T')[0];
        if (orderDateStr !== selectedDate) return false;
      }

      // 2. Status filter
      if (statusFilter !== 'all' && order.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const refMatch = order.orderRef.toLowerCase().includes(query);
        const nameMatch = (order.customerName || '').toLowerCase().includes(query);
        const phoneMatch = order.phone.includes(query);
        const itemsMatch = Array.isArray(order.items) && order.items.some((item: any) => 
          (item.name || '').toLowerCase().includes(query)
        );
        if (!refMatch && !nameMatch && !phoneMatch && !itemsMatch) return false;
      }

      return true;
    });
  }, [orders, selectedDate, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 font-sans text-slate-800 antialiased max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">Live Order Stream</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">WhatsApp Orders</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Real-time management for WhatsApp customer orders</p>
        </div>

        {/* Right side: live date + refresh button */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Today</div>
            <div className="text-sm font-semibold text-slate-700">
              {new Date(todayValue + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleManualRefresh}
            title="Refresh orders"
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium shadow-sm transition-all select-none"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </motion.button>
        </div>
      </div>

      {/* Main Filter & Date Toolbar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        {/* Date Strip Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar size={15} className="text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Select Date</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-xs font-medium text-slate-500 hover:text-emerald-700 underline transition-colors"
              >
                Show All Dates
              </button>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => calendarInputRef.current?.showPicker()}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5 select-none"
              >
                <Calendar size={13} className="text-slate-400" />
                <span>
                  {selectedDate && recentDays.every(rd => rd.value !== selectedDate)
                    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : 'Calendar'
                  }
                </span>
              </button>
              <input
                ref={calendarInputRef}
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute opacity-0 pointer-events-none w-0 h-0 top-0 left-0"
                tabIndex={-1}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Date Pills Strip */}
        <div 
          className="flex gap-2 overflow-x-auto pb-1 pt-1"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {/* "All" Button */}
          <button
            type="button"
            onClick={() => setSelectedDate('')}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all flex flex-col items-center justify-center min-w-[64px] border ${
              selectedDate === ''
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200/70 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="text-[10px] opacity-70 uppercase tracking-wider">All</span>
            <span className="font-semibold mt-0.5">Dates</span>
          </button>

          {/* Recent Days */}
          {recentDays.map((day) => {
            const isActive = selectedDate === day.value;
            const dateObj = new Date(day.value + 'T00:00:00');
            const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
            const dayNum = dateObj.getDate();
            const monthName = dateObj.toLocaleDateString('en-IN', { month: 'short' });
            const isToday = day.label === 'Today';

            return (
              <button
                key={day.value}
                type="button"
                onClick={() => setSelectedDate(isActive ? '' : day.value)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex flex-col items-center justify-center min-w-[62px] border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : isToday
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                    : 'bg-slate-50 text-slate-600 border-slate-200/70 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wider ${isActive ? 'text-slate-300' : isToday ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                  {isToday ? 'Today' : dayName}
                </span>
                <span className="font-semibold text-sm mt-0.5 leading-none">{dayNum} {monthName}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, phone, or order ID..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto gap-1">
            {[
              { key: 'all',        label: 'All' },
              { key: 'sent',       label: 'Sent' },
              { key: 'confirmed',  label: 'Confirmed' },
              { key: 'delivering', label: 'Out for Delivery' },
              { key: 'completed',  label: 'Delivered' },
              { key: 'cancelled',  label: 'Cancelled' },
            ].map(({ key, label }) => {
              const isActive = statusFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Counter Summary */}
        <div className="text-xs text-slate-500 font-medium flex items-center justify-between pt-1">
          <span>
            Showing <strong className="text-slate-800">{filteredOrders.length}</strong> orders
            {selectedDate && <> for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>}
          </span>
          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <MessageCircle size={22} />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No Orders Found</h3>
            <p className="text-slate-500 text-xs mt-1 max-w-sm">
              No orders matched your active filters. Try adjusting your date selection or search query.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const items = (order.items as any[]) || [];
            const formattedCustomerName = formatTitleCase(order.customerName);
            const formattedPhone = formatPhoneNumber(order.phone);
            const timeFormatted = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const status = (order.status || '').toLowerCase();
            let statusBadgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
            let statusLabel = "Sent";

            if (status === 'confirmed') {
              statusBadgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
              statusLabel = "Confirmed";
            } else if (status === 'delivering' || status === 'out_for_delivery') {
              statusBadgeStyle = "bg-amber-50 text-amber-800 border-amber-200";
              statusLabel = "Out for Delivery";
            } else if (status === 'completed' || status === 'delivered') {
              statusBadgeStyle = "bg-sky-50 text-sky-800 border-sky-200";
              statusLabel = "Delivered";
            } else if (status === 'cancelled') {
              statusBadgeStyle = "bg-rose-50 text-rose-800 border-rose-200";
              statusLabel = "Cancelled";
            }

            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Top Card Header */}
                <div className="p-4 bg-slate-50/60 border-b border-slate-100 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-mono font-medium text-slate-400">
                      #{order.orderRef}
                    </div>
                    <h3 className="font-semibold text-base text-slate-900 mt-0.5 leading-snug">
                      {formattedCustomerName}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border ${statusBadgeStyle} select-none`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Card Body & Metadata */}
                <div className="p-4 flex-grow space-y-4 text-xs font-sans">
                  {/* Phone & Time Metadata */}
                  <div className="flex items-center justify-between text-slate-500 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Phone size={13} className="text-slate-400" />
                      <a href={`tel:${order.phone}`} className="hover:text-emerald-700 transition-colors">
                        {formattedPhone}
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                      <Clock size={13} />
                      <span>{timeFormatted}</span>
                    </div>
                  </div>

                  {/* Checklist Items */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Ordered Items
                    </div>
                    <div className="space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100 max-h-40 overflow-y-auto">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-2 text-xs">
                          <div className="flex items-start gap-2">
                            <span className="px-1.5 py-0.5 bg-slate-200/70 text-slate-700 font-mono text-[10px] font-bold rounded">
                              {item.quantity}x
                            </span>
                            <span className="font-medium text-slate-800 leading-snug">
                              {item.name}
                            </span>
                          </div>
                          {item.price > 0 && (
                            <span className="font-mono text-slate-600 font-medium whitespace-nowrap">
                              ₹{item.price * item.quantity}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 pt-3 bg-white border-t border-slate-100 space-y-3 mt-auto">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-grow">
                      {status === 'sent' && (
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 select-none"
                          >
                            <Check size={14} /> Confirm
                          </motion.button>
                          <motion.button
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                            className="py-2 px-3 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-semibold text-xs rounded-xl border border-slate-200/80 transition-all flex items-center justify-center gap-1.5 select-none"
                          >
                            <Ban size={14} /> Cancel
                          </motion.button>
                        </div>
                      )}
                      {status === 'confirmed' && (
                        <motion.button
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUpdateOrderStatus(order.id, 'delivering')}
                          className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 select-none"
                        >
                          <Truck size={14} /> Out for Delivery
                        </motion.button>
                      )}
                      {(status === 'delivering' || status === 'out_for_delivery') && (
                        <motion.button
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                          className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 select-none"
                        >
                          <CheckCircle size={14} /> Complete &amp; Deliver
                        </motion.button>
                      )}
                      {(status === 'completed' || status === 'delivered') && (
                        <div className="w-full py-2 px-3 bg-emerald-50 text-emerald-800 font-semibold text-xs rounded-xl border border-emerald-200/60 flex items-center justify-center gap-1.5">
                          <CheckCircle size={14} className="text-emerald-600" /> Delivered
                        </div>
                      )}
                      {status === 'cancelled' && (
                        <div className="w-full py-2 px-3 bg-rose-50 text-rose-800 font-semibold text-xs rounded-xl border border-rose-200/60 flex items-center justify-center gap-1.5">
                          <AlertCircle size={14} className="text-rose-600" /> Order Cancelled
                        </div>
                      )}
                    </div>

                    {/* WhatsApp Action Button */}
                    <a
                      href={`https://wa.me/${order.phone.replace(/\D/g, '').startsWith('91') || order.phone.replace(/\D/g, '').length > 10 ? '' : '91'}${order.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        getWhatsAppMessage(order)
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open WhatsApp Chat"
                      className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200/70 transition-all flex items-center justify-center flex-shrink-0 shadow-xs"
                    >
                      <WhatsAppIcon size={15} />
                    </a>
                  </div>

                  {/* Order Total Line */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="font-medium text-slate-400">Order Total</span>
                    <span className="font-mono font-bold text-slate-900 text-base">₹{order.total}</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
