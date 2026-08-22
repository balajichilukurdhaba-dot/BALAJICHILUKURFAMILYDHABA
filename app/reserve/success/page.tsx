"use client";
import React, { Suspense, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, Ticket, AlertTriangle, ArrowLeft, Search, 
  RefreshCw, BookmarkCheck, PlusCircle, ArrowRight, MapPin, 
  Calendar, Clock, Users, Phone, ExternalLink, Sparkles
} from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const paramRef = searchParams.get('ref');
  const paramToken = searchParams.get('token');
  const paramName = searchParams.get('name') || '';
  const paramPhone = searchParams.get('phone') || '';
  const paramBranch = searchParams.get('branch') || 'Balaji Dhaba Moinabad';
  const paramDate = searchParams.get('date') || '';
  const paramTime = searchParams.get('time') || '';
  const paramGuests = searchParams.get('guests') || '';

  const [bookingRef, setBookingRef] = useState<string | null>(paramRef);
  const [token, setToken] = useState<string | null>(paramToken);
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [showLookupModal, setShowLookupModal] = useState(false);

  // Persistence & Recovery Logic
  useEffect(() => {
    if (paramRef && paramToken) {
      localStorage.setItem('active_booking_ref', paramRef);
      localStorage.setItem('active_booking_token', paramToken);
      setBookingRef(paramRef);
      setToken(paramToken);
    } else {
      const cachedRef = localStorage.getItem('active_booking_ref');
      const cachedToken = localStorage.getItem('active_booking_token');
      if (cachedRef && cachedToken) {
        setBookingRef(cachedRef);
        setToken(cachedToken);
      }
    }
  }, [paramRef, paramToken]);

  const handlePhoneLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupPhone) return;
    setLookupLoading(true);
    setLookupError('');

    try {
      const res = await fetch(`/api/reservations/lookup?phone=${encodeURIComponent(lookupPhone)}`);
      const data = await res.json();
      if (!res.ok || !data.success || !data.reservations || data.reservations.length === 0) {
        throw new Error('No active reservations found for this phone number.');
      }

      const latest = data.reservations[0];
      setBookingRef(latest.bookingRef);
      setToken(latest.qrToken);
      localStorage.setItem('active_booking_ref', latest.bookingRef);
      localStorage.setItem('active_booking_token', latest.qrToken);
      setShowLookupModal(false);
    } catch (err: any) {
      setLookupError(err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  const openWhatsAppConfirmation = () => {
    const waNumber = '919849498681';
    const waText = 
`🍽️ *CONFIRMED TABLE RESERVATION - BALAJI SANTOSH FAMILY DHABA*
------------------------------------------
📋 *Booking Ref:* #${bookingRef}
${paramName ? `👤 *Guest Name:* ${paramName}\n` : ''}${paramPhone ? `📞 *Phone:* ${paramPhone}\n` : ''}${paramGuests ? `👥 *Guests:* ${paramGuests}\n` : ''}${paramDate ? `📅 *Date:* ${paramDate}\n` : ''}${paramTime ? `⏰ *Time:* ${paramTime}\n` : ''}${paramBranch ? `📍 *Branch:* ${paramBranch}\n` : ''}🎁 *Claimed Benefit:* 10% Online Booking Discount Voucher
------------------------------------------
My table reservation is confirmed on the website. Thank you!`;

    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, '_blank');
  };

  if (!bookingRef || !token) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 p-8 text-center space-y-6 font-sans">
        <AlertTriangle size={56} className="mx-auto text-amber-500" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">No Active Booking Found</h2>
          <p className="text-slate-500 text-xs mt-1">If you refreshed or cleared your browser, enter your phone number to retrieve your QR code pass.</p>
        </div>

        <form onSubmit={handlePhoneLookup} className="space-y-3 pt-2">
          {lookupError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl font-medium">
              {lookupError}
            </div>
          )}
          <input
            type="tel"
            required
            placeholder="Enter Phone Number (e.g. 98765 43210)"
            value={lookupPhone}
            onChange={(e) => setLookupPhone(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-xs focus:outline-none focus:border-slate-800 font-medium"
          />
          <button
            type="submit"
            disabled={lookupLoading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {lookupLoading ? <RefreshCw className="animate-spin" size={14} /> : <Search size={14} />}
            <span>Retrieve Booking Pass &amp; QR</span>
          </button>
        </form>

        <div className="pt-2">
          <Link href="/reserve" className="text-xs font-semibold text-slate-600 hover:underline">
            ← Book New Table
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/90 font-sans">
      <div className="bg-[#1E4D2B] p-8 text-center text-white relative overflow-hidden">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-3"
        >
          <CheckCircle2 size={36} className="text-[#E0B252]" />
        </motion.div>
        <span className="inline-block bg-[#E0B252]/20 border border-[#E0B252]/40 text-[#E0B252] text-[10px] font-extrabold uppercase tracking-widest px-3 py-0.5 rounded-full mb-1">
          Table Reserved &amp; Saved
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-white">Booking Confirmed!</h2>
        <p className="text-white/80 text-xs mt-0.5">We look forward to hosting your dining experience.</p>
      </div>

      <div className="p-6 space-y-5 flex flex-col items-center">
        <div className="text-center bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-6 w-full">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Booking Reference ID</p>
          <p className="font-mono text-2xl font-black text-slate-900 tracking-wider">#{bookingRef}</p>
        </div>

        {(paramName || paramDate || paramTime || paramGuests) && (
          <div className="w-full bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-slate-400 font-semibold">Guest:</span>
              <span className="font-bold text-slate-900">{paramName || 'Guest'}</span>
            </div>
            {paramDate && (
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-400 font-semibold">Date &amp; Time:</span>
                <span className="font-bold text-slate-900">{paramDate} &bull; {paramTime}</span>
              </div>
            )}
            {paramGuests && (
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-400 font-semibold">Party Size:</span>
                <span className="font-bold text-slate-900">{paramGuests}</span>
              </div>
            )}
            {paramBranch && (
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-400 font-semibold">Branch:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{paramBranch}</span>
              </div>
            )}
          </div>
        )}

        <div className="bg-gradient-to-b from-amber-50/50 to-emerald-50/40 p-5 rounded-2xl w-full border border-amber-200/70 relative overflow-hidden flex flex-col items-center shadow-xs">
          <div className="flex items-center gap-1.5 mb-3 text-emerald-900 font-bold uppercase tracking-wider text-[11px] z-10">
            <Ticket size={15} className="text-emerald-700" />
            <span>10% Online Booking Discount Voucher</span>
          </div>
          
          <div className="bg-white p-3 rounded-2xl shadow-sm z-10 mb-3 border border-slate-200">
            <QRCodeSVG 
              value={token} 
              size={175}
              level="H"
              fgColor="#0F172A"
              bgColor="#FFFFFF"
            />
          </div>
          
          <p className="text-[11px] text-center font-sans text-slate-600 z-10 max-w-[240px] leading-relaxed">
            Show this QR code voucher to the staff at the billing counter during your visit to get 10% off.
          </p>
        </div>

        <div className="w-full space-y-2.5 pt-1">
          <button
            onClick={openWhatsAppConfirmation}
            className="w-full py-3.5 px-5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.076-1.792-.405-1.487-.617-2.435-2.123-2.51-2.222-.075-.099-.597-.795-.597-1.516 0-.72.378-1.074.512-1.222.134-.149.294-.187.393-.187.099 0 .198.001.284.006.091.004.213-.034.333.255.124.298.423 1.034.46 1.109.037.075.062.162.012.261-.049.099-.074.162-.148.249-.075.087-.157.194-.224.261-.075.074-.153.155-.066.304.087.149.387.639.83 1.033.57.507 1.05.664 1.199.738.149.075.236.062.324-.037.087-.099.373-.435.473-.584.099-.149.198-.124.333-.075.134.05.852.402 1 .475.148.075.247.112.284.174.037.062.037.36-.107.765z"/>
            </svg>
            <span>Open WhatsApp Confirmation</span>
          </button>

          <Link
            href="/reserve"
            className="w-full py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <PlusCircle size={15} className="text-[#E0B252]" />
              <span>Book Another Table</span>
            </div>
            <ArrowRight size={14} className="text-[#E0B252] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ReservationSuccessPage() {
  return (
    <div className="pt-28 pb-20 px-4 md:px-8 min-h-screen relative overflow-hidden flex items-center justify-center bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full z-10"
      >
        <Suspense fallback={<div className="text-center font-bold font-sans text-xs text-slate-500">Loading booking pass...</div>}>
          <SuccessContent />
        </Suspense>
      </motion.div>
    </div>
  );
}
