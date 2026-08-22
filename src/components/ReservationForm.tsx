"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, Clock, Users, User, Phone, FileText, Loader2, 
  PartyPopper, ChevronDown, Check, Ticket, MapPin, Sparkles,
  CheckCircle2, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TIME_SLOTS = [
  { value: '11:00', label: '11:00 AM' },
  { value: '11:30', label: '11:30 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '12:30', label: '12:30 PM' },
  { value: '13:00', label: '01:00 PM' },
  { value: '13:30', label: '01:30 PM' },
  { value: '14:00', label: '02:00 PM' },
  { value: '14:30', label: '02:30 PM' },
  { value: '15:00', label: '03:00 PM' },
  { value: '15:30', label: '03:30 PM' },
  { value: '16:00', label: '04:00 PM' },
  { value: '16:30', label: '04:30 PM' },
  { value: '17:00', label: '05:00 PM' },
  { value: '17:30', label: '05:30 PM' },
  { value: '18:00', label: '06:00 PM' },
  { value: '18:30', label: '06:30 PM' },
  { value: '19:00', label: '07:00 PM' },
  { value: '19:30', label: '07:30 PM' },
  { value: '20:00', label: '08:00 PM' },
  { value: '20:30', label: '08:30 PM' },
  { value: '21:00', label: '09:00 PM' },
  { value: '21:30', label: '09:30 PM' },
  { value: '22:00', label: '10:00 PM' },
  { value: '22:30', label: '10:30 PM' },
  { value: '23:00', label: '11:00 PM' },
];

const GUEST_OPTIONS = [
  { value: '1', label: '1 Person' },
  { value: '2', label: '2 Persons' },
  { value: '3', label: '3 Persons' },
  { value: '4', label: '4 Persons' },
  { value: '5', label: '5 Persons' },
  { value: '6', label: '6 Persons' },
  { value: '7', label: '7 Persons' },
  { value: '8', label: '8 Persons' },
  { value: '9', label: '9 Persons' },
  { value: '10', label: '10 Persons' },
  { value: '10+', label: '10+ Persons (Family Group)' },
];

const BRANCH_OPTIONS = [
  { 
    id: '52ae6a0f-daee-40f5-aa0e-ac44e17d325e', 
    name: 'Moinabad Branch (Aziz Nagar / Chilkur Rd)',
    phone: '919849498681',
    address: 'Aziz Nagar, Himayat Sagar Rd, Moinabad'
  },
  { 
    id: 'a2ae6a0f-daee-40f5-aa0e-ac44e17d325f', 
    name: 'Pragathi Nagar Branch (Opp. Lake, Kukatpally)',
    phone: '919849498681',
    address: 'Opp. Pragathi Nagar Lake, Kukatpally'
  }
];

export const ReservationForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isGuestsDropdownOpen, setIsGuestsDropdownOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  const timeDropdownRef = useRef<HTMLDivElement>(null);
  const guestsDropdownRef = useRef<HTMLDivElement>(null);
  const branchDropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    branchId: '52ae6a0f-daee-40f5-aa0e-ac44e17d325e',
    customerName: '',
    phone: '',
    email: '',
    guests: '2',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    specialInstructions: ''
  });

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(e.target as Node)) {
        setIsTimeDropdownOpen(false);
      }
      if (guestsDropdownRef.current && !guestsDropdownRef.current.contains(e.target as Node)) {
        setIsGuestsDropdownOpen(false);
      }
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [activeBooking, setActiveBooking] = useState<{ ref: string; token: string } | null>(null);

  // Check for cached active booking pass on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedRef = localStorage.getItem('active_booking_ref');
      const cachedToken = localStorage.getItem('active_booking_token');
      if (cachedRef && cachedToken) {
        setActiveBooking({ ref: cachedRef, token: cachedToken });
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectTime = (slotValue: string) => {
    setFormData(prev => ({ ...prev, time: slotValue }));
    setIsTimeDropdownOpen(false);
  };

  const handleSelectGuests = (guestValue: string) => {
    setFormData(prev => ({ ...prev, guests: guestValue }));
    setIsGuestsDropdownOpen(false);
  };

  const handleSelectBranch = (branchId: string) => {
    setFormData(prev => ({ ...prev, branchId }));
    setIsBranchDropdownOpen(false);
  };

  const selectedSlot = TIME_SLOTS.find(s => s.value === formData.time) || TIME_SLOTS[16];
  const selectedGuestOption = GUEST_OPTIONS.find(g => g.value === formData.guests) || GUEST_OPTIONS[1];
  const selectedBranch = BRANCH_OPTIONS.find(b => b.id === formData.branchId) || BRANCH_OPTIONS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Submit to API -> Saves in PostgreSQL / Supabase Database
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to make reservation');
      }

      const bookingRef = data.reservation.bookingRef;
      const qrToken = data.qrToken;

      // 2. Persist in local storage for instant pass retrieval
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_booking_ref', bookingRef);
        localStorage.setItem('active_booking_token', qrToken);
      }

      // 3. Build WhatsApp Confirmation Message (if user opted in or by default)
      if (sendWhatsApp) {
        const waNumber = selectedBranch.phone || '919849498681';
        const waText = 
`🍽️ *NEW TABLE RESERVATION - BALAJI SANTOSH FAMILY DHABA*
------------------------------------------
📋 *Booking Ref:* #${bookingRef}
👤 *Guest Name:* ${formData.customerName.trim()}
📞 *Phone Number:* ${formData.phone.trim()}
👥 *Total Guests:* ${selectedGuestOption.label}
📅 *Date:* ${formData.date}
⏰ *Time:* ${selectedSlot.label}
📍 *Branch:* ${selectedBranch.name}
${formData.specialInstructions ? `📝 *Special Request:* ${formData.specialInstructions.trim()}\n` : ''}🎁 *Claimed Benefit:* 10% Online Booking Discount Voucher
------------------------------------------
Please confirm our table booking. We are looking forward to dining with you!`;

        const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;
        // Open WhatsApp in new tab
        if (typeof window !== 'undefined') {
          window.open(waUrl, '_blank');
        }
      }

      // 4. Redirect to booking confirmation & QR pass page
      router.push(
        `/reserve/success?ref=${bookingRef}&token=${encodeURIComponent(qrToken)}&name=${encodeURIComponent(formData.customerName)}&phone=${encodeURIComponent(formData.phone)}&branch=${encodeURIComponent(selectedBranch.name)}&date=${encodeURIComponent(formData.date)}&time=${encodeURIComponent(selectedSlot.label)}&guests=${encodeURIComponent(selectedGuestOption.label)}`
      );

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#FFFFFF] rounded-3xl shadow-2xl overflow-hidden border border-brand-dark/10 font-sans">
      {/* Header Banner */}
      <div className="bg-brand-dark p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <PartyPopper size={120} className="text-brand-gold" />
        </div>
        <div className="inline-flex items-center gap-1.5 bg-[#E0B252]/20 border border-[#E0B252]/40 px-3 py-1 rounded-full text-[#E0B252] text-[11px] font-bold uppercase tracking-wider mb-2 relative z-10">
          <Sparkles size={12} />
          <span>Online Booking Special</span>
        </div>
        <h2 className="text-3xl font-display font-bold text-white mb-2 relative z-10">Book Your Dining Table</h2>
        <p className="text-brand-gold font-sans font-medium relative z-10 text-xs sm:text-sm tracking-wide uppercase">
          Instant WhatsApp Confirmation + 10% Off QR Voucher!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
        {activeBooking && (
          <div className="bg-emerald-50 border border-emerald-200/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-900 font-medium">
            <div className="flex items-center gap-2">
              <Ticket className="text-emerald-600 shrink-0" size={18} />
              <span>You have a confirmed booking pass (Ref: <strong className="font-mono text-emerald-950 font-bold">#{activeBooking.ref}</strong>)</span>
            </div>
            <Link 
              href={`/reserve/success?ref=${activeBooking.ref}&token=${encodeURIComponent(activeBooking.token)}`}
              className="bg-[#1E4D2B] hover:bg-[#163a20] text-white font-semibold px-3.5 py-2 rounded-xl shrink-0 transition-colors shadow-xs text-[11px]"
            >
              View Active QR Code →
            </Link>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-semibold border border-red-100 flex items-center justify-center">
            {error}
          </div>
        )}

        {/* Branch Selector */}
        <div className="space-y-1.5 relative" ref={branchDropdownRef}>
          <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 ml-1 flex items-center gap-1">
            <MapPin size={13} className="text-brand-accent" />
            <span>Select Dhaba Branch *</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsBranchDropdownOpen(prev => !prev);
                setIsTimeDropdownOpen(false);
                setIsGuestsDropdownOpen(false);
              }}
              className="w-full bg-white border border-brand-dark/15 rounded-xl py-3 pl-4 pr-10 text-left text-brand-dark font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all flex items-center justify-between shadow-xs hover:border-brand-dark/30"
            >
              <span className="truncate font-semibold">{selectedBranch.name}</span>
              <ChevronDown size={16} className={`text-brand-dark/50 transition-transform duration-200 shrink-0 ${isBranchDropdownOpen ? 'rotate-180 text-brand-dark' : ''}`} />
            </button>

            <AnimatePresence>
              {isBranchDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute top-full mt-1.5 left-0 w-full bg-white border border-slate-200/90 rounded-xl shadow-xl z-50 p-1 overflow-hidden"
                >
                  <div className="space-y-1">
                    {BRANCH_OPTIONS.map((branch) => {
                      const isSelected = branch.id === formData.branchId;
                      return (
                        <button
                          key={branch.id}
                          type="button"
                          onClick={() => handleSelectBranch(branch.id)}
                          className={`w-full text-left px-3.5 py-2.5 text-xs rounded-lg transition-colors flex items-center justify-between font-medium ${
                            isSelected 
                              ? 'bg-slate-900 text-white font-semibold'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div>
                            <p className="font-bold">{branch.name}</p>
                            <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>{branch.address}</p>
                          </div>
                          {isSelected && <Check size={14} className="text-emerald-400 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Customer Name & Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 ml-1">Full Name *</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/40" size={18} />
              <input 
                required 
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                type="text" 
                className="w-full bg-white border border-brand-dark/15 rounded-xl py-3 pl-11 pr-4 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all text-xs sm:text-sm font-medium placeholder-slate-400"
                placeholder="e.g. Ramesh Sharma"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 ml-1">Phone Number (For WhatsApp) *</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/40" size={18} />
              <input 
                required 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                type="tel" 
                className="w-full bg-white border border-brand-dark/15 rounded-xl py-3 pl-11 pr-4 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all text-xs sm:text-sm font-medium placeholder-slate-400"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
        </div>

        {/* Date, Time & Guests */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 ml-1">Date *</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark/40" size={16} />
              <input 
                required 
                name="date"
                value={formData.date}
                onChange={handleChange}
                type="date" 
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-white border border-brand-dark/15 rounded-xl py-3 pl-10 pr-3 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all text-xs sm:text-sm font-medium"
              />
            </div>
          </div>

          {/* Time Picker */}
          <div className="space-y-1.5 relative" ref={timeDropdownRef}>
            <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 ml-1">Time *</label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark/40 z-10 pointer-events-none" size={16} />
              <button
                type="button"
                onClick={() => {
                  setIsTimeDropdownOpen(prev => !prev);
                  setIsGuestsDropdownOpen(false);
                  setIsBranchDropdownOpen(false);
                }}
                className="w-full bg-white border border-brand-dark/15 rounded-xl py-3 pl-10 pr-8 text-left text-brand-dark font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all flex items-center justify-between shadow-xs hover:border-brand-dark/30"
              >
                <span>{selectedSlot.label}</span>
                <ChevronDown size={15} className={`text-brand-dark/50 transition-transform duration-200 ${isTimeDropdownOpen ? 'rotate-180 text-brand-dark' : ''}`} />
              </button>

              <AnimatePresence>
                {isTimeDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute top-full mt-1.5 left-0 w-full bg-white border border-slate-200/90 rounded-xl shadow-xl z-50 p-1 overflow-hidden"
                  >
                    <div className="max-h-[175px] overflow-y-auto space-y-0.5 pr-1 divide-y divide-slate-50 scrollbar-thin scrollbar-thumb-slate-300">
                      {TIME_SLOTS.map((slot) => {
                        const isSelected = slot.value === formData.time;
                        return (
                          <button
                            key={slot.value}
                            type="button"
                            onClick={() => handleSelectTime(slot.value)}
                            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between font-medium ${
                              isSelected 
                                ? 'bg-slate-900 text-white font-semibold'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <span>{slot.label}</span>
                            {isSelected && <Check size={14} className="text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Guests Picker */}
          <div className="space-y-1.5 relative" ref={guestsDropdownRef}>
            <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 ml-1">Guests *</label>
            <div className="relative">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark/40 z-10 pointer-events-none" size={16} />
              <button
                type="button"
                onClick={() => {
                  setIsGuestsDropdownOpen(prev => !prev);
                  setIsTimeDropdownOpen(false);
                  setIsBranchDropdownOpen(false);
                }}
                className="w-full bg-white border border-brand-dark/15 rounded-xl py-3 pl-10 pr-8 text-left text-brand-dark font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all flex items-center justify-between shadow-xs hover:border-brand-dark/30"
              >
                <span className="truncate">{selectedGuestOption.label}</span>
                <ChevronDown size={15} className={`text-brand-dark/50 transition-transform duration-200 ${isGuestsDropdownOpen ? 'rotate-180 text-brand-dark' : ''}`} />
              </button>

              <AnimatePresence>
                {isGuestsDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute top-full mt-1.5 left-0 w-full bg-white border border-slate-200/90 rounded-xl shadow-xl z-50 p-1 overflow-hidden"
                  >
                    <div className="max-h-[175px] overflow-y-auto space-y-0.5 pr-1 divide-y divide-slate-50 scrollbar-thin scrollbar-thumb-slate-300">
                      {GUEST_OPTIONS.map((g) => {
                        const isSelected = g.value === formData.guests;
                        return (
                          <button
                            key={g.value}
                            type="button"
                            onClick={() => handleSelectGuests(g.value)}
                            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between font-medium ${
                              isSelected 
                                ? 'bg-slate-900 text-white font-semibold'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <span>{g.label}</span>
                            {isSelected && <Check size={14} className="text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Special Requests */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 ml-1">Special Requests (Optional)</label>
          <div className="relative">
            <FileText className="absolute left-4 top-3.5 text-brand-dark/40" size={16} />
            <textarea 
              name="specialInstructions"
              value={formData.specialInstructions}
              onChange={handleChange}
              rows={2}
              className="w-full bg-white border border-brand-dark/15 rounded-xl py-2.5 pl-11 pr-4 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all resize-none text-xs sm:text-sm font-medium placeholder-slate-400"
              placeholder="e.g. Birthday celebration, AC section seating, high chair needed..."
            />
          </div>
        </div>

        {/* WhatsApp Instant Sync Checkbox Banner */}
        <div 
          onClick={() => setSendWhatsApp(prev => !prev)}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
            sendWhatsApp 
              ? 'bg-emerald-50/80 border-emerald-300/90 text-emerald-950' 
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${sendWhatsApp ? 'bg-[#25D366] text-white shadow-xs' : 'bg-slate-200 text-slate-500'}`}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.076-1.792-.405-1.487-.617-2.435-2.123-2.51-2.222-.075-.099-.597-.795-.597-1.516 0-.72.378-1.074.512-1.222.134-.149.294-.187.393-.187.099 0 .198.001.284.006.091.004.213-.034.333.255.124.298.423 1.034.46 1.109.037.075.062.162.012.261-.049.099-.074.162-.148.249-.075.087-.157.194-.224.261-.075.074-.153.155-.066.304.087.149.387.639.83 1.033.57.507 1.05.664 1.199.738.149.075.236.062.324-.037.087-.099.373-.435.473-.584.099-.149.198-.124.333-.075.134.05.852.402 1 .475.148.075.247.112.284.174.037.062.037.36-.107.765z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">
                Instant WhatsApp Confirmation (+91 98494 98681)
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                Automatically saves to website database &amp; opens WhatsApp with 1-click
              </p>
            </div>
          </div>
          <input 
            type="checkbox"
            checked={sendWhatsApp}
            onChange={() => {}} 
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 shrink-0"
          />
        </div>

        {/* 1-Button 2-Functionality Submit Button */}
        <motion.button 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#1E4D2B] hover:bg-[#163a20] text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-[0_6px_0_0_#12301A] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#12301A] active:translate-y-[6px] active:shadow-[0_0px_0_0_#12301A] transition-all flex items-center justify-center gap-2.5 border border-emerald-800"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Confirming Reservation &amp; Generating Pass...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={18} className="text-[#E0B252]" />
              <span>Confirm Booking &amp; Send to WhatsApp</span>
              <ArrowRight size={16} className="text-[#E0B252]" />
            </>
          )}
        </motion.button>

        <p className="text-center text-[10px] text-brand-dark/50 uppercase tracking-widest font-medium">
          ⚡ 1-Click: Saves to Website Database + Opens WhatsApp Instantly
        </p>
      </form>
    </div>
  );
};
