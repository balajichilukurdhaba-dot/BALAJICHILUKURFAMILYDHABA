"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Users, User, Phone, Mail, FileText, Loader2, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';

export const ReservationForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    branchId: '52ae6a0f-daee-40f5-aa0e-ac44e17d325e', // Use the test branch created earlier
    customerName: '',
    phone: '',
    email: '',
    guests: '2',
    date: '',
    time: '19:00',
    specialInstructions: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

      // Success - Redirect to confirmation page with token
      router.push(`/reserve/success?ref=${data.reservation.bookingRef}&token=${encodeURIComponent(data.qrToken)}`);

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#FFFFFF] rounded-3xl shadow-2xl overflow-hidden border border-brand-dark/10">
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
                className="w-full bg-white border border-brand-dark/10 rounded-xl py-3 pl-12 pr-4 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
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
                className="w-full bg-white border border-brand-dark/10 rounded-xl py-3 pl-12 pr-4 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                className="w-full bg-white border border-brand-dark/10 rounded-xl py-3 pl-12 pr-4 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 ml-1">Time</label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/40" size={18} />
              <select 
                required 
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full bg-white border border-brand-dark/10 rounded-xl py-3 pl-12 pr-4 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all appearance-none"
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
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 ml-1">Guests</label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/40" size={18} />
              <select 
                required 
                name="guests"
                value={formData.guests}
                onChange={handleChange}
                className="w-full bg-white border border-brand-dark/10 rounded-xl py-3 pl-12 pr-4 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all appearance-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, '10+'].map(num => (
                  <option key={num} value={num}>{num} Person{num !== 1 && 's'}</option>
                ))}
              </select>
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
              className="w-full bg-white border border-brand-dark/10 rounded-xl py-3 pl-12 pr-4 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all resize-none"
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
