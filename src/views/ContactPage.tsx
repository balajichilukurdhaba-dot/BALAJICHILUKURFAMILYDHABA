"use client";
import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Mail, CheckCircle2, Loader2 } from 'lucide-react';

const STATIC_BRANCHES = [
  {
    name: "Moinabad Branch",
    address: "4-15/2part, Aziz Nagar, Himayat Sagar Rd, Moinabad, Telangana 500075",
    phone: "+91 93471 04569",
    mapEmbedUrl: "https://maps.google.com/maps?q=Balaji%20Santosh%20Family%20Dhaba%20Aziz%20Nagar%20Himayat%20Sagar%20Rd%20Moinabad%20Telangana&t=&z=15&ie=UTF8&iwloc=&output=embed",
    mapNavUrl: "https://www.google.com/maps/search/?api=1&query=Balaji+Santosh+Family+Dhaba+Aziz+Nagar+Himayat+Sagar+Rd+Moinabad+Telangana",
    rating: "4.1 ★ (63 reviews)",
    openingTime: "11:00",
    closingTime: "23:00"
  },
  {
    name: "Visit Our Second Branch – Pragathi Nagar",
    address: "Opposite Pragathi Nagar Lake, Pragathi Nagar, Kukatpally, Hyderabad, Telangana 500090",
    phone: "+91 93471 04569",
    mapEmbedUrl: "https://maps.google.com/maps?q=Balaji%20Santosh%20Family%20Dhaba%20Pragathi%20Nagar%20Kukatpally%20Hyderabad&t=&z=15&ie=UTF8&iwloc=&output=embed",
    mapNavUrl: "https://www.google.com/maps/search/?api=1&query=Balaji+Santosh+Family+Dhaba+Pragathi+Nagar+Kukatpally+Hyderabad",
    rating: "4.3 ★ (19 reviews)",
    openingTime: "11:00",
    closingTime: "23:00"
  }
];

export const ContactPage: React.FC = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBranch, setActiveBranch] = useState(0);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', interest: 'Catering', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await fetch('/api/cms/branches');
        const data = await res.json();
        if (data.success && data.branches.length > 0) {
          const mapped = data.branches.map((b: any) => {
            const q = encodeURIComponent(`${b.name} ${b.address}`);
            return {
              id: b.id,
              name: b.name,
              address: b.address,
              phone: b.phone,
              mapEmbedUrl: b.mapEmbedUrl || `https://maps.google.com/maps?q=${q}&t=&z=15&ie=UTF8&iwloc=&output=embed`,
              mapNavUrl: b.mapNavUrl || `https://www.google.com/maps/search/?api=1&query=${q}`,
              rating: b.name.toLowerCase().includes('moinabad') ? "4.1 ★ (63 reviews)" : "4.3 ★ (19 reviews)",
              openingTime: b.openingTime || "11:00",
              closingTime: b.closingTime || "23:00"
            };
          });

          // Sort Moinabad first, Pragathi Nagar second
          mapped.sort((a: any, b: any) => {
            if (a.name.includes("Moinabad")) return -1;
            if (b.name.includes("Moinabad")) return 1;
            return 0;
          });

          setBranches(mapped);
        }
      } catch (error) {
        console.error('Failed to load branches:', error);
      } finally {
        setLoading(false);
      }
    }
    loadBranches();
  }, []);

  const displayBranches = branches.length > 0 ? branches : STATIC_BRANCHES;
  const branch = displayBranches[activeBranch] || displayBranches[0] || {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/cms/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          subject: `Contact Inquiry: ${formData.interest}`,
          message: formData.message || `No message. Interest: ${formData.interest}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsSubmitted(true);
        setFormData({ name: '', email: '', phone: '', interest: 'Catering', message: '' });
        setTimeout(() => {
          setIsSubmitted(false);
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to send contact inquiry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 pb-24 bg-brand-bg noise-overlay min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-brand-accent mb-4" size={48} />
        <p className="font-display text-xl font-bold text-brand-dark">Loading Contact Details...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 bg-brand-bg noise-overlay min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Get in Touch</span>
          <h1 className="font-display text-4xl md:text-6xl font-black text-brand-dark mt-3">
            Contact & Reservations
          </h1>
          <p className="text-brand-dark/70 font-sans text-sm md:text-base mt-4">
            Have questions about catering, private dining, or food recommendations? Our team is delighted to assist you.
          </p>
        </div>

        {/* Branch Selector animated cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16 font-sans">
          {branches.map((b: any, idx: number) => {
            const isActive = activeBranch === idx;
            const isMoinabad = b.name.toLowerCase().includes('moinabad');
            return (
              <div 
                key={b.id || idx}
                onClick={() => setActiveBranch(idx)}
                className={`p-6 rounded-3xl cursor-pointer border transition-all duration-500 flex flex-col justify-between ${
                  isActive
                    ? 'bg-white border-[#1E4D2B] shadow-lg shadow-[#1E4D2B]/5 scale-[1.02]'
                    : 'bg-[#ECE3D4]/25 border-brand-dark/5 hover:border-brand-dark/15 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                      isMoinabad ? 'text-[#1E4D2B] bg-[#1E4D2B]/10' : 'text-brand-dark/60 bg-brand-dark/5'
                    }`}>
                      {isMoinabad ? 'Primary Location' : `Branch #${idx + 1}`}
                    </span>
                    <span className="text-xs text-[#90EE90] font-semibold">{isMoinabad ? '★★★★★' : '★★★★☆'}</span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-brand-dark mt-4">{b.name}</h3>
                  <p className="text-xs text-brand-dark/65 mt-1 leading-relaxed">
                    {isMoinabad 
                      ? 'Our premier flagship location offering an exceptional pure vegetarian dining experience.'
                      : 'Authentic pure vegetarian store location.'
                    }
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-brand-dark/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                  <span className={isMoinabad ? 'text-[#2ECC71]' : 'text-brand-gold'}>
                    ● {isMoinabad ? 'Open Now' : 'Visit Branch'}
                  </span>
                  <span className={isActive ? 'text-[#1E4D2B]' : 'text-brand-dark/50'}>
                    {isActive ? 'Currently Selected' : 'Select Branch →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16 items-stretch">
          {/* Details Column */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8 bg-brand-dark text-[#FFFFFF] p-8 md:p-12 rounded-2xl transition-all duration-500">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">Direct Lines</span>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold mt-3 mb-8">
                {branch.name}
              </h2>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <MapPin className="text-brand-gold mt-1 shrink-0" size={20} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#FFFFFF]/50">Address</h4>
                    <p className="text-sm mt-1 leading-relaxed">{branch.address}</p>
                  </div>
                </div>

                {branch.phone && (
                  <div className="flex items-start space-x-4">
                    <Phone className="text-brand-gold mt-1 shrink-0" size={18} />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#FFFFFF]/50">Phone</h4>
                      <a href={`tel:${branch.phone.replace(/\s+/g, '')}`} className="text-sm font-semibold hover:text-brand-gold mt-1 block">
                        {branch.phone}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-4">
                  <Clock className="text-brand-gold mt-1 shrink-0" size={18} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#FFFFFF]/50">Hours of Operation</h4>
                    <p className="text-sm mt-1">Daily: {branch.openingTime || '11:00'} AM – {branch.closingTime || '23:00'} PM</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Mail className="text-brand-gold mt-1 shrink-0" size={18} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#FFFFFF]/50">Email Support</h4>
                    <p className="text-sm mt-1">contact@balajisantoshdhaba.com</p>
                  </div>
                </div>
              </div>
            </div>

            {branch.rating && (
              <div className="pt-8 border-t border-[#FFFFFF]/15">
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gold">Google Rating</h4>
                <p className="font-display text-2xl font-black text-[#FFFFFF] mt-1">{branch.rating}</p>
              </div>
            )}
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7 bg-[#ECE3D4]/40 p-8 md:p-12 rounded-2xl border border-brand-dark/5 flex flex-col justify-center">
            {isSubmitted ? (
              <div className="text-center py-12 flex flex-col items-center">
                <CheckCircle2 size={56} className="text-green-600 mb-4" />
                <h3 className="font-display text-2xl font-bold text-brand-dark">Message Received Successfully!</h3>
                <p className="text-sm font-sans text-brand-dark/75 mt-2 max-w-sm">
                  Thank you for contacting Balaji Chilkur Family Dhaba. We will get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold uppercase tracking-widest text-brand-dark/65 mb-2">Name *</label>
                  <input 
                    type="text" 
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-brand-bg border border-brand-dark/15 rounded-xl px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-brand-dark/65 mb-2">Email *</label>
                    <input 
                      type="email" 
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-brand-bg border border-brand-dark/15 rounded-xl px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-accent transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-widest text-brand-dark/65 mb-2">Phone *</label>
                    <input 
                      type="tel" 
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-brand-bg border border-brand-dark/15 rounded-xl px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-accent transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="interest" className="block text-xs font-bold uppercase tracking-widest text-brand-dark/65 mb-2">Inquiry Type</label>
                  <select 
                    id="interest"
                    value={formData.interest}
                    onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                    className="w-full bg-brand-bg border border-brand-dark/15 rounded-xl px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-accent transition-colors"
                  >
                    <option value="Catering">Bulk Catering Inquiry</option>
                    <option value="TableBooking">Special Occasion Dining</option>
                    <option value="Feedback">Feedback / Suggestions</option>
                    <option value="General">Other Queries</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-bold uppercase tracking-widest text-brand-dark/65 mb-2">Message</label>
                  <textarea 
                    id="message" 
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-brand-bg border border-brand-dark/15 rounded-xl px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-accent hover:bg-brand-accent/90 text-brand-bg font-bold uppercase tracking-wider text-xs py-4 rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Sending Inquiry...</span>
                    </>
                  ) : (
                    <span>Send Inquiry</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Embedded styled Map */}
        {branch.mapEmbedUrl && (
          <div className="h-[450px] w-full rounded-2xl overflow-hidden border border-brand-dark/10 shadow-md transition-all duration-500">
            <iframe 
              title={`${branch.name} Location Map`}
              src={branch.mapEmbedUrl}
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy"
            />
          </div>
        )}

      </div>
    </div>
  );
};
