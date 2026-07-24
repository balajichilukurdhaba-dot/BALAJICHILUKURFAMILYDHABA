"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Users, User, Phone, FileText, Loader2, PartyPopper, ChevronDown, Check, Ticket } from 'lucide-react';
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
  { value: '10+', label: '10+ Persons' },
];

export const ReservationForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isGuestsDropdownOpen, setIsGuestsDropdownOpen] = useState(false);
  
  const timeDropdownRef = useRef<HTMLDivElement>(null);
  const guestsDropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    branchId: '52ae6a0f-daee-40f5-aa0e-ac44e17d325e',
    customerName: '',
    phone: '',
    email: '',
    guests: '2',
    date: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to make reservation');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('active_booking_ref', data.reservation.bookingRef);
        localStorage.setItem('active_booking_token', data.qrToken);
      }

      router.push(`/reserve/success?ref=${data.reservation.bookingRef}&token=${encodeURIComponent(data.qrToken)}`);

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const selectedSlot = TIME_SLOTS.find(s => s.value === formData.time) || TIME_SLOTS[16];
  const selectedGuestOption = GUEST_OPTIONS.find(g => g.value === formData.guests) || GUEST_OPTIONS[1];

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#FFFFFF] rounded-3xl shadow-2xl overflow-hidden border border-brand-dark/10 font-sans">
      <div className="bg-brand-dark p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <PartyPopper size={120} className="text-brand-gold" />
        </div>
        <h2 className="text-3xl font-display font-bold text-white mb-2 relative z-10">Book Your Table</h2>
        <p className="text-brand-gold font-sans font-medium relative z-10 text-sm tracking-wide uppercase">
          Get 10% Off when you book online!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {activeBooking && (
          <div className="bg-emerald-50 border border-emerald-200/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-900 font-medium">
            <div className="flex items-center gap-2">
              <Ticket className="text-emerald-600 shrink-0" size={18} />
              <span>You have a confirmed booking pass (Ref: <strong className="font-mono">{activeBooking.ref}</strong>)</span>
            </div>
            <Link 
              href={`/reserve/success?ref=${activeBooking.ref}&token=${encodeURIComponent(activeBooking.token)}`}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-colors shadow-sm text-[11px]"
            >
              View Active QR Code →
            </Link>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold border border-red-100 flex items-center justify-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/40" size={18} />
              <input 
                required 
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                type="text" 
                className="w-full bg-white border border-brand-dark/10 rounded-xl py-3 pl-12 pr-4 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all text-sm"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 ml-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/40" size={18} />
              <input 
                required 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                type="tel" 
                className="w-full bg-white border border-brand-dark/10 rounded-xl py-3 pl-12 pr-4 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all text-sm"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 ml-1">Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/40" size={18} />
              <input 
                required 
                name="date"
                value={formData.date}
                onChange={handleChange}
                type="date" 
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-white border border-brand-dark/10 rounded-xl py-3 pl-12 pr-4 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all text-sm"
              />
            </div>
          </div>

          {/* Software Grade Downward Time Picker (Exactly 5 items visible with scroll) */}
          <div className="space-y-1.5 relative" ref={timeDropdownRef}>
            <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 ml-1">Time</label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/40 z-10 pointer-events-none" size={18} />
              <button
                type="button"
                onClick={() => {
                  setIsTimeDropdownOpen(prev => !prev);
                  setIsGuestsDropdownOpen(false);
                }}
                className="w-full bg-white border border-brand-dark/10 rounded-xl py-3 pl-12 pr-10 text-left text-brand-dark font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all flex items-center justify-between shadow-sm hover:border-brand-dark/30"
              >
                <span>{selectedSlot.label}</span>
                <ChevronDown size={16} className={`text-brand-dark/50 transition-transform duration-200 ${isTimeDropdownOpen ? 'rotate-180 text-brand-dark' : ''}`} />
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

          {/* Software Grade Downward Guests Picker (Exactly 5 items visible with scroll) */}
          <div className="space-y-1.5 relative" ref={guestsDropdownRef}>
            <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 ml-1">Guests</label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/40 z-10 pointer-events-none" size={18} />
              <button
                type="button"
                onClick={() => {
                  setIsGuestsDropdownOpen(prev => !prev);
                  setIsTimeDropdownOpen(false);
                }}
                className="w-full bg-white border border-brand-dark/10 rounded-xl py-3 pl-12 pr-10 text-left text-brand-dark font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all flex items-center justify-between shadow-sm hover:border-brand-dark/30"
              >
                <span>{selectedGuestOption.label}</span>
                <ChevronDown size={16} className={`text-brand-dark/50 transition-transform duration-200 ${isGuestsDropdownOpen ? 'rotate-180 text-brand-dark' : ''}`} />
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

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 ml-1">Special Requests (Optional)</label>
          <div className="relative">
            <FileText className="absolute left-4 top-4 text-brand-dark/40" size={18} />
            <textarea 
              name="specialInstructions"
              value={formData.specialInstructions}
              onChange={handleChange}
              rows={3}
              className="w-full bg-white border border-brand-dark/10 rounded-xl py-3 pl-12 pr-4 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all resize-none text-sm"
              placeholder="Allergies, high chair needed, celebrating a birthday..."
            />
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-brand-accent text-white font-bold uppercase tracking-widest rounded-xl shadow-[0_6px_0_0_#12301A] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#12301A] active:translate-y-[6px] active:shadow-[0_0px_0_0_#12301A] transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Confirming...</span>
            </>
          ) : (
            <span>Confirm Reservation</span>
          )}
        </motion.button>
      </form>
    </div>
  );
};
