'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageCircle, CheckCircle, Calendar, Phone, Search, X, RefreshCw, Truck, Ban, Check, AlertCircle } from 'lucide-react';

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

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={size} height={size} fill="currentColor">
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L3.2 496l131.6-34.5c32.5 17.7 68.9 27 105.8 27 122.4 0 222-99.6 222-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-78.5 20.6 21-76.5-4.4-7.1c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
  </svg>
);

// Helper to get local date string (YYYY-MM-DD) for any offset from today
function getLocalDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
}

function getWhatsAppMessage(order: { orderRef: string; customerName: string | null; status: string; total: string }): string {
  const customer = order.customerName || 'Valued Customer';
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

  // local state to handle immediate state update on button click
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

  // todayValue is reactive — updates at midnight so the strip always shows the correct "Today"
  const [todayValue, setTodayValue] = useState<string>(() => getLocalDateStr(0));

  // Default to TODAY so the admin sees today's orders immediately
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateStr(0));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const calendarInputRef = useRef<HTMLInputElement>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ─── Auto-refresh: fetch new orders from DB every 60 seconds ──────────────
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      router.refresh(); // re-runs the server component to get latest orders
    }, 60_000);
    return () => clearInterval(refreshInterval);
  }, [router]);

  // ─── Midnight date-roll: detect when the calendar day changes ─────────────
  useEffect(() => {
    const checkDateRoll = setInterval(() => {
      const newToday = getLocalDateStr(0);
      if (newToday !== todayValue) {
        setTodayValue(newToday);
        // If the admin was viewing the old "today", snap forward to the new today
        setSelectedDate((prev) => (prev === todayValue ? newToday : prev));
      }
    }, 60_000); // check every minute
    return () => clearInterval(checkDateRoll);
  }, [todayValue]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Build a full 60-day scrollable date strip (reactive to todayValue)
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
    <div className="space-y-8">
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent bg-brand-accent/15 px-3 py-1 rounded-full border border-brand-accent/20">
            Realtime Feeds
          </span>
          <h1 className="text-3xl font-display font-black text-brand-dark mt-3">WhatsApp Orders</h1>
          <p className="text-brand-dark/60 font-sans text-sm mt-1">Manage delivery and pickup orders sent via WhatsApp client</p>
        </div>
        {/* Right side: live date + refresh button */}
        <div className="flex items-center gap-3 md:flex-col md:items-end">
          <div className="text-right">
            <div className="text-xs font-black uppercase tracking-widest text-brand-dark/40">Today</div>
            <div className="text-base font-black text-brand-dark">
              {new Date(todayValue + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <button
            onClick={handleManualRefresh}
            title="Refresh orders now"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-dark text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-brand-dark/85 transition-all active:scale-95"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>


      {/* Advanced Toolbar */}
      <div className="bg-white rounded-3xl p-6 border border-brand-gold/10 shadow-sm space-y-4">

        {/* Scrollable Date Card Strip */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Calendar size={15} className="text-brand-gold" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark/45">Filter by Date — scroll for older dates</span>
            <div className="ml-auto flex items-center gap-2">
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-accent hover:underline"
                >
                  <X size={10} /> Clear
                </button>
              )}
              {/* Calendar picker button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => calendarInputRef.current?.showPicker()}
                  title="Pick any date from calendar"
                  className={`date-card-base flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-[11px] font-black uppercase tracking-wide ${
                    selectedDate && recentDays.every(rd => rd.value !== selectedDate)
                      ? 'date-card-active bg-brand-dark border-brand-dark text-white shadow-md'
                      : 'bg-[#FAF6EE] border-brand-dark/10 text-brand-dark/55 hover:border-brand-dark/25'
                  }`}
                >
                  <Calendar size={13} />
                  {selectedDate && recentDays.every(rd => rd.value !== selectedDate)
                    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Pick Date'
                  }
                </button>
                <input
                  ref={calendarInputRef}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute opacity-0 pointer-events-none w-0 h-0 top-0 left-0"
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          {/* Horizontally scrollable date cards */}
          <div
            className="flex gap-2 overflow-x-auto pb-2 pt-1"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes cardPop {
                0%   { transform: scale(0.88); opacity: 0.4; }
                60%  { transform: scale(1.10); }
                100% { transform: scale(1.06); opacity: 1; }
              }
              @keyframes todayPulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(196,130,61,0.0); }
                50%       { box-shadow: 0 0 0 5px rgba(196,130,61,0.18); }
              }
              @keyframes activeGlow {
                0%, 100% { box-shadow: 0 4px 18px rgba(30,20,10,0.22); }
                50%       { box-shadow: 0 4px 24px rgba(30,20,10,0.38); }
              }
              .date-card-active  { animation: cardPop 0.28s cubic-bezier(.34,1.56,.64,1) forwards, activeGlow 2.4s ease-in-out 0.3s infinite; }
              .date-card-today   { animation: todayPulse 2.6s ease-in-out infinite; }
              .date-card-base    { transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease; }
              .date-card-base:hover { transform: translateY(-3px) scale(1.05); box-shadow: 0 6px 18px rgba(0,0,0,0.10); }
              .date-card-base:active { transform: scale(0.94); }

              .status-tab { transition: all 0.22s cubic-bezier(.34,1.56,.64,1); }
              .status-tab-active { transform: scale(1.07); box-shadow: 0 3px 12px rgba(196,88,50,0.30); }
              .status-tab:hover:not(.status-tab-active) { transform: scale(1.04); }
            `}} />

            {/* "All" card */}
            <button
              type="button"
              onClick={() => setSelectedDate('')}
              className={`date-card-base flex-shrink-0 flex flex-col items-center justify-center w-[50px] h-[60px] rounded-xl border-2 ${
                selectedDate === ''
                  ? 'date-card-active bg-brand-dark border-brand-dark text-white'
                  : 'bg-[#FAF6EE] border-brand-dark/10 text-brand-dark/60'
              }`}
            >
              <span className={`text-[9px] font-black uppercase tracking-wide ${selectedDate === '' ? 'text-white/60' : 'text-brand-dark/35'}`}>View</span>
              <span className="text-[13px] font-black mt-0.5 leading-none">All</span>
            </button>

            {/* Recent date cards — Today first, scroll left for older */}
            {recentDays.map((day) => {
              const isActive = selectedDate === day.value;
              const dateObj = new Date(day.value + 'T00:00:00');
              const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
              const dayNum = dateObj.getDate();
              const monthName = dateObj.toLocaleDateString('en-IN', { month: 'short' });
              const isToday = day.label === 'Today';
              const isYesterday = day.label === 'Yesterday';

              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => setSelectedDate(isActive ? '' : day.value)}
                  className={`date-card-base flex-shrink-0 flex flex-col items-center justify-center w-[50px] h-[60px] rounded-xl border-2 ${
                    isActive
                      ? 'date-card-active bg-brand-dark border-brand-dark text-white'
                      : isToday
                      ? 'date-card-today bg-brand-accent/10 border-brand-accent/40 text-brand-dark'
                      : 'bg-[#FAF6EE] border-brand-dark/10 text-brand-dark/70'
                  }`}
                >
                  <span className={`text-[9px] font-black uppercase tracking-wide leading-none ${
                    isActive ? 'text-white/60' : isToday ? 'text-brand-accent' : 'text-brand-dark/35'
                  }`}>
                    {isToday ? 'Today' : isYesterday ? 'Yest.' : dayName}
                  </span>
                  <span className="text-base font-black leading-tight mt-0.5">{dayNum}</span>
                  <span className={`text-[9px] font-bold leading-none ${
                    isActive ? 'text-white/50' : 'text-brand-dark/35'
                  }`}>{monthName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-brand-dark/5" />

        {/* Search + Status row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/40" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, order ref, dish..."
              className="w-full pl-11 pr-4 py-2.5 bg-[#FAF6EE] border border-brand-dark/10 rounded-2xl font-semibold text-brand-dark text-sm focus:outline-none focus:border-brand-accent transition-all h-[42px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-dark/40 hover:text-brand-dark"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status tab switcher */}
          <div className="flex bg-[#FAF6EE] p-1 rounded-2xl border border-brand-dark/5 flex-shrink-0 h-[42px] overflow-x-auto max-w-full gap-0.5">
            {([
              { key: 'all',        label: 'All',        active: 'bg-brand-accent text-white shadow-sm' },
              { key: 'sent',       label: 'Sent',       active: 'bg-zinc-800 text-white shadow-sm' },
              { key: 'confirmed',  label: 'Confirmed',  active: 'bg-emerald-600 text-white shadow-sm' },
              { key: 'delivering', label: 'Delivering', active: 'bg-amber-500 text-white shadow-sm' },
              { key: 'completed',  label: 'Delivered',  active: 'bg-sky-600 text-white shadow-sm' },
              { key: 'cancelled',  label: 'Cancelled',  active: 'bg-rose-600 text-white shadow-sm' },
            ] as const).map(({ key, label, active }) => {
              const isActive = statusFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`status-tab px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
                    isActive ? active : 'text-brand-dark/55 hover:text-brand-dark'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Summary — always visible */}
        <div className="flex items-center justify-between border-t border-brand-dark/5 pt-3 text-xs font-semibold text-brand-dark/50">
          <div>
            {selectedDate
              ? <>Showing <span className="text-brand-dark font-black">{filteredOrders.length}</span> orders for <span className="text-brand-dark font-black">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></>
              : <>Showing <span className="text-brand-dark font-black">{filteredOrders.length}</span> of <span className="text-brand-dark font-black">{initialOrders.length}</span> total orders (all dates)</>
            }
          </div>
          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="text-brand-accent hover:underline flex items-center gap-1 font-bold uppercase tracking-wider text-[10px]"
            >
              <X size={10} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Grid displays orders as kitchen tickets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-16 text-center border border-brand-gold/10 shadow-sm flex flex-col items-center justify-center">
            <MessageCircle className="text-brand-dark/25 mb-4" size={48} />
            <h3 className="font-bold text-lg text-brand-dark">No Orders Found</h3>
            <p className="text-brand-dark/50 text-sm mt-1 max-w-xs leading-relaxed">
              No orders matched your selected filters. Try changing your search query or date range selection.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const items = (order.items as any[]) || [];
            
            return (
              <motion.div 
                key={order.id} 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl border border-brand-gold/10 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col relative group"
              >
                {/* Header Ticket Bar */}
                <div className="bg-brand-dark p-3.5 px-4.5 text-[#FFFFFF] flex justify-between items-start border-b border-brand-gold/10">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-brand-gold font-bold">
                      Ref: {order.orderRef}
                    </span>
                    <h3 className="font-display font-bold text-sm mt-0.5 text-white">
                      {order.customerName || 'Anonymous Customer'}
                    </h3>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-black uppercase rounded-lg border ${
                    order.status === 'sent'       ? 'bg-zinc-900/30 text-zinc-400 border-zinc-800/30' :
                    order.status === 'confirmed'  ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/30' :
                    order.status === 'delivering' ? 'bg-amber-950/30 text-amber-400 border-amber-800/30' :
                    order.status === 'completed'  ? 'bg-sky-950/30 text-sky-400 border-sky-800/30' :
                    'bg-rose-950/30 text-rose-400 border-rose-800/30'
                  }`}>
                    {order.status === 'completed' ? 'Delivered' : order.status}
                  </span>
                </div>

                {/* Body Details */}
                <div className="p-3.5 flex-grow space-y-3 font-sans">
                  {/* Metadata Info */}
                  <div className="grid grid-cols-2 gap-4 text-[10px] text-brand-dark/75 border-b border-brand-dark/5 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Phone size={10} className="text-brand-accent" />
                      <a href={`tel:${order.phone}`} className="hover:underline font-semibold">{order.phone}</a>
                      <a
                        href={`https://wa.me/${order.phone.replace(/\D/g, '').startsWith('91') || order.phone.replace(/\D/g, '').length > 10 ? '' : '91'}${order.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                          getWhatsAppMessage(order)
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 ml-1 transition-colors flex items-center justify-center"
                        title="WhatsApp Chat"
                      >
                        <WhatsAppIcon size={11} />
                      </a>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <Calendar size={10} className="text-brand-gold" />
                      <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Items Breakdown list */}
                  <div>
                    <h4 className="text-[8px] font-black uppercase tracking-widest text-brand-dark/50 mb-1.5">
                       Order Checklist
                    </h4>
                    <ul className="space-y-1.5 bg-[#FFFFFF]/30 p-2.5 rounded-xl border border-brand-gold/5 max-h-32 overflow-y-auto">
                      {items.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-start text-xs">
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-bold text-brand-accent bg-brand-accent/10 px-1 py-0.2 rounded text-[9px]">
                              {item.quantity}x
                            </span>
                            <span className="font-semibold text-brand-dark leading-snug">{item.name}</span>
                          </div>
                          <span className="text-brand-dark/70 font-semibold font-mono text-[10px]">
                            ₹{item.price * item.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Status Action Buttons Row */}
                <div className="px-3.5 pb-3.5 bg-white flex items-center justify-between gap-2 border-t border-brand-dark/5 pt-3">
                  <div className="flex-grow flex items-center gap-2">
                    {order.status === 'sent' && (
                      <>
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                          className="res-action-btn flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/10"
                        >
                          <Check size={12} /> Confirm
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                          className="res-action-btn flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-rose-600/10"
                        >
                          <Ban size={12} /> Cancel
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'delivering')}
                        className="res-action-btn w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/10"
                      >
                        <Truck size={13} className="animate-pulse" /> Out for Delivery
                      </button>
                    )}
                    {order.status === 'delivering' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                        className="res-action-btn w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-sky-600/10"
                      >
                        <CheckCircle size={13} /> Complete &amp; Deliver
                      </button>
                    )}
                    {order.status === 'completed' && (
                      <div className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 text-emerald-700 font-extrabold text-xs rounded-xl border border-emerald-100/70 shadow-sm">
                        <Check size={14} className="text-emerald-600" /> Order Delivered
                      </div>
                    )}
                    {order.status === 'cancelled' && (
                      <div className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-50 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-100/70 shadow-sm">
                        <AlertCircle size={14} className="text-rose-600" /> Order Cancelled
                      </div>
                    )}
                  </div>

                  <a
                    href={`https://wa.me/${order.phone.replace(/\D/g, '').startsWith('91') || order.phone.replace(/\D/g, '').length > 10 ? '' : '91'}${order.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      getWhatsAppMessage(order)
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Direct WhatsApp Chat"
                    className="res-action-btn flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-100 hover:bg-[#1E4D2B] text-emerald-700 hover:text-white transition-all shadow-md shadow-emerald-600/10 border border-emerald-200/50"
                  >
                    <WhatsAppIcon size={14} />
                  </a>
                </div>

                {/* Footer POS bar */}
                <div className="px-4 py-2.5 bg-[#FFFFFF]/50 border-t border-brand-gold/10 flex justify-between items-center mt-auto">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-brand-dark/55">
                    Order Total
                  </span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[9px] font-bold text-brand-accent">₹</span>
                    <span className="text-base font-black text-brand-accent font-mono">
                      {order.total}
                    </span>
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
