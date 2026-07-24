"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, CheckCircle, Clock, Search, Filter, Phone, Users, Plus, 
  X, Mail, FileText, Loader2, AlertCircle, Edit, Save, Trash2, Check,
  User, CheckSquare, Square, RefreshCw
} from 'lucide-react';

// Helper: get local YYYY-MM-DD string offset by daysAgo from today
function getLocalDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
}

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={size} height={size} fill="currentColor">
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L3.2 496l131.6-34.5c32.5 17.7 68.9 27 105.8 27 122.4 0 222-99.6 222-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-78.5 20.6 21-76.5-4.4-7.1c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
  </svg>
);

export default function ReservationsClient({ initialReservations }: { initialReservations: any[] }) {
  const router = useRouter();
  const calendarInputRef = useRef<HTMLInputElement>(null);

  // Reactive today — updates at midnight
  const [todayValue, setTodayValue] = useState<string>(() => getLocalDateStr(0));
  // Default: show today's reservations
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateStr(0));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [reservations, setReservations] = useState<any[]>(initialReservations);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'claimed'>('all');

  // Modal State for manual entry
  const [showAddModal, setShowAddModal] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // 60-day scrollable date strip (reactive to todayValue so it refreshes at midnight)
  const recentDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 60; i++) {
      const d = new Date(todayValue + 'T00:00:00');
      d.setDate(d.getDate() - i);
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - offset * 60 * 1000);
      const value = local.toISOString().split('T')[0];
      let label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      days.push({ label, value });
    }
    return days;
  }, [todayValue]);

  // Auto-refresh from DB every 60s
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(interval);
  }, [router]);

  // Midnight date-roll detection (check every minute)
  useEffect(() => {
    const check = setInterval(() => {
      const newToday = getLocalDateStr(0);
      if (newToday !== todayValue) {
        setTodayValue(newToday);
        setSelectedDate(prev => prev === todayValue ? newToday : prev);
      }
    }, 60_000);
    return () => clearInterval(check);
  }, [todayValue]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  useEffect(() => {
    loadBranches();
  }, []);

  // Manual Form Fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [guests, setGuests] = useState('2');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [branchId, setBranchId] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBranches();
  }, []);

  async function loadBranches() {
    setLoadingBranches(true);
    try {
      const res = await fetch('/api/cms/branches');
      const data = await res.json();
      if (data.success) {
        setBranches(data.branches || []);
        if (data.branches?.length > 0) {
          setBranchId(data.branches[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBranches(false);
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const discountVerified = (newStatus === 'arrived' || newStatus === 'completed');
    try {
      const res = await fetch('/api/reservations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, discountVerified })
      });
      const data = await res.json();
      if (data.success) {
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, discountVerified } : r));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleClaim = async (id: string, currentClaimed: boolean) => {
    const nextClaimed = !currentClaimed;
    const nextStatus = nextClaimed ? 'arrived' : 'pending';
    try {
      const res = await fetch('/api/reservations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, discountVerified: nextClaimed, status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        setReservations(prev => prev.map(r => r.id === id ? { ...r, discountVerified: nextClaimed, status: nextStatus } : r));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !date || !time || !branchId) {
      alert("Please fill all required fields.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          customerName,
          phone,
          email: email || null,
          guests: parseInt(guests),
          date,
          time,
          specialInstructions: specialInstructions || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setReservations(prev => [data.reservation, ...prev]);
        setShowAddModal(false);
        resetForm();
      } else {
        alert(data.error || "Failed to create reservation");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setPhone('');
    setEmail('');
    setGuests('2');
    setDate('');
    setTime('19:00');
    setSpecialInstructions('');
  };

  const isOptionDisabled = (currentStatus: string, optionValue: string) => {
    if (currentStatus === optionValue) return false;
    if (currentStatus === 'completed' || currentStatus === 'cancelled') return true;
    
    if (currentStatus === 'arrived') {
      return optionValue === 'pending' || optionValue === 'confirmed';
    }
    if (currentStatus === 'confirmed') {
      return optionValue === 'pending';
    }
    return false;
  };

  const filtered = reservations.filter((res) => {
    // Date filter: match reservation date field
    if (selectedDate && res.date !== selectedDate) return false;

    const matchesSearch =
      res.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.phone.includes(searchTerm) ||
      res.bookingRef.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter — All / Confirmed / Pending / Cancelled / Claimed
    const matchesStatus =
      statusFilter === 'all'       ? true
      : statusFilter === 'claimed' ? res.discountVerified === true
      : res.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort: pending → confirmed → claimed → cancelled
  const STATUS_ORDER: Record<string, number> = { pending: 0, confirmed: 1, claimed: 2, cancelled: 3 };
  const sortedFiltered = [...filtered].sort((a, b) => {
    const ao = STATUS_ORDER[a.status] ?? 9;
    const bo = STATUS_ORDER[b.status] ?? 9;
    if (ao !== bo) return ao - bo;
    // within same status, most-recent date first
    return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Table Reservations & Guest Bookings</h1>
          <p className="text-xs text-slate-500 mt-1">Manage guest table bookings, walk-ins, and voucher status.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live today display */}
          <div className="text-right hidden md:block border-r border-slate-200 pr-4 mr-1">
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Today's Date</div>
            <div className="text-xs font-semibold text-slate-800">
              {new Date(todayValue + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
          <button
            onClick={handleManualRefresh}
            title="Refresh reservations"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-sm transition-colors"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-slate-900' : 'text-slate-500'} />
            <span>Sync Live</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm transition-colors"
          >
            <Plus size={14} />
            <span>Create Booking</span>
          </button>
        </div>
      </div>

      {/* Date Filter Strip */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 space-y-4">
        {/* Strip header */}
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-amber-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Filter by Reservation Date — scroll for older dates</span>
          <div className="ml-auto flex items-center gap-2">
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 hover:underline"
              >
                <X size={9} /> Clear
              </button>
            )}
            {/* Calendar picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => calendarInputRef.current?.showPicker()}
                className={`res-date-card-base flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-wide ${
                  selectedDate && recentDays.every(rd => rd.value !== selectedDate)
                    ? 'res-date-card-active bg-zinc-800 border-zinc-800 text-white shadow-md'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-400'
                }`}
              >
                <Calendar size={11} />
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

        {/* Scrollable date cards */}
        <div
          className="flex gap-2 overflow-x-auto pb-2 pt-1"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes resCardPop {
              0%   { transform: scale(0.88); opacity: 0.4; }
              60%  { transform: scale(1.10); }
              100% { transform: scale(1.06); opacity: 1; }
            }
            @keyframes resTodayPulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.0); }
              50%       { box-shadow: 0 0 0 5px rgba(245,158,11,0.18); }
            }
            @keyframes resActiveGlow {
              0%, 100% { box-shadow: 0 4px 18px rgba(39,39,42,0.22); }
              50%       { box-shadow: 0 4px 24px rgba(39,39,42,0.38); }
            }
            .res-date-card-active  { animation: resCardPop 0.28s cubic-bezier(.34,1.56,.64,1) forwards, resActiveGlow 2.4s ease-in-out 0.3s infinite; }
            .res-date-card-today   { animation: resTodayPulse 2.6s ease-in-out infinite; }
            .res-date-card-base    { transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease; }
            .res-date-card-base:hover { transform: translateY(-3px) scale(1.05); box-shadow: 0 6px 18px rgba(0,0,0,0.08); }
            .res-date-card-base:active { transform: scale(0.94); }

            .res-status-tab { transition: all 0.22s cubic-bezier(.34,1.56,.64,1); }
            .res-status-tab-active { transform: scale(1.07); }
            .res-status-tab:hover:not(.res-status-tab-active) { transform: scale(1.04); }

            .res-action-btn { transition: all 0.2s cubic-bezier(.34,1.56,.64,1); }
            .res-action-btn:hover { transform: translateY(-1.5px) scale(1.03); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
            .res-action-btn:active { transform: scale(0.96); }
          `}} />

          {/* View All card */}
          <button
            type="button"
            onClick={() => setSelectedDate('')}
            className={`res-date-card-base flex-shrink-0 flex flex-col items-center justify-center w-[50px] h-[60px] rounded-xl border-2 ${
              selectedDate === ''
                ? 'res-date-card-active bg-zinc-800 border-zinc-800 text-white'
                : 'bg-zinc-50 border-zinc-200 text-zinc-500'
            }`}
          >
            <span className={`text-[9px] font-black uppercase tracking-wide ${selectedDate === '' ? 'text-white/60' : 'text-zinc-400'}`}>View</span>
            <span className="text-[13px] font-black mt-0.5 leading-none">All</span>
          </button>

          {/* Recent 60-day date cards */}
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
                className={`res-date-card-base flex-shrink-0 flex flex-col items-center justify-center w-[50px] h-[60px] rounded-xl border-2 ${
                  isActive
                    ? 'res-date-card-active bg-zinc-800 border-zinc-800 text-white'
                    : isToday
                    ? 'res-date-card-today bg-amber-50 border-amber-300 text-zinc-800'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                }`}
              >
                <span className={`text-[9px] font-black uppercase tracking-wide leading-none ${
                  isActive ? 'text-white/60' : isToday ? 'text-amber-600' : 'text-zinc-400'
                }`}>
                  {isToday ? 'Today' : isYesterday ? 'Yest.' : dayName}
                </span>
                <span className="text-base font-black leading-tight mt-0.5">{dayNum}</span>
                <span className={`text-[9px] font-bold leading-none ${isActive ? 'text-white/50' : 'text-zinc-400'}`}>{monthName}</span>
              </button>
            );
          })}
        </div>

        {/* Filter summary */}
        <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-[10px] font-semibold text-zinc-400">
          <div>
            {selectedDate
              ? <><span className="text-zinc-800 font-black">{sortedFiltered.length}</span> reservations for <span className="text-zinc-800 font-black">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></>
              : <>Showing <span className="text-zinc-800 font-black">{sortedFiltered.length}</span> of <span className="text-zinc-800 font-black">{reservations.length}</span> total reservations (all dates)</>
            }
          </div>
          {(searchTerm || statusFilter !== 'all') && (
            <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); }} className="text-amber-600 hover:underline flex items-center gap-1 font-bold uppercase">
              <X size={9} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Search + Status Filter Row */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input 
            type="text"
            placeholder="Search by name, phone, or booking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 pl-10 pr-4 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 transition-all text-xs"
          />
        </div>

        {/* Filter Tabs — All / Pending / Claimed / Confirmed / Cancelled */}
        <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200 gap-0.5">
          {([
            { key: 'all',       label: 'All',       active: 'bg-zinc-800 text-white shadow-sm res-status-tab-active' },
            { key: 'pending',   label: 'Pending',    active: 'bg-amber-500 text-white shadow-sm res-status-tab-active shadow-amber-500/30' },
            { key: 'claimed',   label: 'Claimed',    active: 'bg-violet-600 text-white shadow-sm res-status-tab-active shadow-violet-600/30' },
            { key: 'confirmed', label: 'Confirmed',  active: 'bg-emerald-600 text-white shadow-sm res-status-tab-active shadow-emerald-600/30' },
            { key: 'cancelled', label: 'Cancelled',  active: 'bg-rose-600 text-white shadow-sm res-status-tab-active shadow-rose-600/30' },
          ] as const).map(({ key, label, active }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`res-status-tab px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === key ? active : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Database list card */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-50">
                <th className="p-4 pl-6">Ref ID</th>
                <th className="p-5">Customer Details</th>
                <th className="p-5">Date & Time</th>
                <th className="p-5">Size</th>
                <th className="p-5">Discount (10% Off)</th>
                <th className="p-5">Status</th>
                <th className="p-5 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-sans">
              {sortedFiltered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-400 font-medium">No reservations match the filters.</td>
                </tr>
              ) : (
                sortedFiltered.map((res) => (
                  <tr key={res.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-5 pl-6 font-mono font-bold text-zinc-800">{res.bookingRef}</td>
                    <td className="p-5">
                      <div className="font-bold text-zinc-800">{res.customerName}</div>
                      <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                        <Phone size={10} className="text-zinc-400" />
                        {res.phone}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-1 font-semibold text-zinc-800">
                        <Calendar size={12} className="text-zinc-400" />
                        {new Date(res.date).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{res.time}</div>
                    </td>
                    <td className="p-5 font-bold text-zinc-800">
                      <div className="flex items-center gap-1">
                        <Users size={12} className="text-zinc-300" />
                        <span>{res.guests} persons</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <button
                        onClick={() => handleToggleClaim(res.id, res.discountVerified)}
                        className={`res-action-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider border transition-all ${
                          res.discountVerified
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100/50'
                            : 'bg-zinc-100 text-zinc-800 border-zinc-200 hover:bg-zinc-200'
                        }`}
                      >
                        {res.discountVerified ? (
                          <>
                            <CheckCircle size={10} />
                            <span>Claimed</span>
                          </>
                        ) : (
                          <>
                            <Clock size={10} />
                            <span>Unclaimed</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-5">
                      <select
                        value={res.status}
                        onChange={(e) => handleUpdateStatus(res.id, e.target.value)}
                        className={`res-action-btn px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border focus:outline-none transition-all cursor-pointer ${
                          res.status === 'confirmed' ? 'bg-sky-50 text-sky-800 border-sky-100' :
                          res.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                          res.status === 'cancelled' ? 'bg-rose-50 text-rose-800 border-rose-100' :
                          res.status === 'arrived' ? 'bg-zinc-100 text-zinc-800 border-zinc-200' :
                          'bg-zinc-50 text-zinc-600 border-zinc-200'
                        }`}
                      >
                        <option value="pending" disabled={isOptionDisabled(res.status, 'pending')}>Pending</option>
                        <option value="confirmed" disabled={isOptionDisabled(res.status, 'confirmed')}>Confirmed</option>
                        <option value="arrived" disabled={isOptionDisabled(res.status, 'arrived')}>Arrived/Claimed</option>
                        <option value="completed" disabled={isOptionDisabled(res.status, 'completed')}>Completed</option>
                        <option value="cancelled" disabled={isOptionDisabled(res.status, 'cancelled')}>Cancelled</option>
                      </select>
                    </td>
                    <td className="p-5 pr-6 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        {/* Call Customer Button */}
                        <a
                          href={`tel:${res.phone}`}
                          title={`Call ${res.customerName || 'Customer'}`}
                          className="res-action-btn flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 transition-all border border-zinc-200/50"
                        >
                          <Phone size={11} />
                        </a>

                        {/* WhatsApp Customer Button */}
                        <a
                          href={`https://wa.me/${res.phone.replace(/\D/g, '').startsWith('91') || res.phone.replace(/\D/g, '').length > 10 ? '' : '91'}${res.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Hello ${res.customerName || 'Customer'}, regarding your table reservation Ref: ${res.bookingRef} on ${new Date(res.date).toLocaleDateString()} at ${res.time} at Balaji Chilkur Family Dhaba:`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`WhatsApp ${res.customerName || 'Customer'}`}
                          className="res-action-btn flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 hover:text-emerald-950 transition-all border border-emerald-200/50"
                        >
                          <WhatsAppIcon size={12} />
                        </a>

                        {/* Special Instructions tooltip */}
                        {res.specialInstructions && (
                          <span 
                            className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.5 rounded cursor-help font-bold tracking-wider uppercase ml-1"
                            title={res.specialInstructions}
                          >
                            Notes
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Create Booking Modal --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleCreateBooking} className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-brand-dark/5 space-y-6">
            <div className="flex justify-between items-center border-b border-brand-dark/5 pb-4">
              <h3 className="font-display font-black text-xl text-brand-dark">
                Manual Booking Entry
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1 text-brand-dark/45 hover:text-brand-dark">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/65 mb-1.5">Outlet Branch *</label>
                {loadingBranches ? (
                  <div className="py-2 text-xs text-brand-dark/50 flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" />
                    <span>Loading branches...</span>
                  </div>
                ) : (
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    required
                    className="w-full bg-brand-bg border border-brand-dark/10 rounded-xl px-4 py-3 text-xs focus:outline-none"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/65 mb-1.5">Guest Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Balaji"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-dark/10 rounded-xl px-4 py-3 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/65 mb-1.5">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 93471 04569"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-dark/10 rounded-xl px-4 py-3 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/65 mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. custom@guest.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-dark/10 rounded-xl px-4 py-3 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/65 mb-1.5">Total Guests *</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  required
                  className="w-full bg-brand-bg border border-brand-dark/10 rounded-xl px-4 py-3 text-xs focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map(n => (
                    <option key={n} value={n}>{n} Guests</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/65 mb-1.5">Schedule Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-dark/10 rounded-xl px-4 py-3 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/65 mb-1.5">Slot Time *</label>
                <select
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-dark/10 rounded-xl px-4 py-3 text-xs focus:outline-none"
                >
                  <option value="11:00">11:00 AM</option>
                  <option value="11:30">11:30 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="12:30">12:30 PM</option>
                  <option value="13:00">01:00 PM</option>
                  <option value="13:30">01:30 PM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="14:30">02:30 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="15:30">03:30 PM</option>
                  <option value="16:00">04:00 PM</option>
                  <option value="16:30">04:30 PM</option>
                  <option value="17:00">05:00 PM</option>
                  <option value="17:30">05:30 PM</option>
                  <option value="18:00">06:00 PM</option>
                  <option value="18:30">06:30 PM</option>
                  <option value="19:00">07:00 PM</option>
                  <option value="19:30">07:30 PM</option>
                  <option value="20:00">08:00 PM</option>
                  <option value="20:30">08:30 PM</option>
                  <option value="21:00">09:00 PM</option>
                  <option value="21:30">09:30 PM</option>
                  <option value="22:00">10:00 PM</option>
                  <option value="22:30">10:30 PM</option>
                  <option value="23:00">11:00 PM</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/65 mb-1.5">Special seating or dining instructions</label>
                <textarea
                  placeholder="Spice levels, extra chairs, near garden, window seat preferences..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-dark/10 rounded-xl px-4 py-3 text-xs focus:outline-none"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-brand-dark/5">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-5 py-3 rounded-xl border border-brand-dark/10 hover:bg-brand-dark/5 text-brand-dark text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-brand-accent hover:bg-brand-accent/90 text-white text-xs font-bold uppercase tracking-wider shadow-md"
              >
                {saving ? 'Creating...' : 'Create Booking'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
