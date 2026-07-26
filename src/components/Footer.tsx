import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Clock, Compass } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await fetch('/api/cms/branches');
        const data = await res.json();
        if (data.success && data.branches) {
          // Sort Moinabad first, others second
          const sorted = [...data.branches].sort((a: any, b: any) => {
            if (a.name.toLowerCase().includes('moinabad')) return -1;
            if (b.name.toLowerCase().includes('moinabad')) return 1;
            return 0;
          });
          setBranches(sorted);
        }
      } catch (e) {
        console.error('Failed to load footer branches:', e);
      }
    }
    loadBranches();
  }, []);

  return (
    <footer className="bg-brand-dark text-[#FFFFFF]/80 border-t border-brand-gold/15 py-20 px-6 md:px-12 relative overflow-hidden font-sans">
      {/* Decorative luxury gradient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
        
        {/* Brand Info */}
        <div className="flex flex-col space-y-6">
          <Link href="/" className="flex items-center space-x-2 md:space-x-3 group">
            <img 
              src="/bsd-logo.png" 
              alt="Balaji Chilkur Family Dhaba Logo" 
              className="w-10 h-10 rounded-full object-contain bg-black/25 border border-brand-gold/30 shadow-md group-hover:border-brand-gold transition-colors"
            />
            <span className="font-display text-sm md:text-base font-bold tracking-wider uppercase text-brand-bg group-hover:text-brand-gold transition-colors duration-300">
              BALAJI CHILUKUR DHABA
            </span>
          </Link>
          <p className="text-sm leading-relaxed text-[#FFFFFF]/60">
            A tradition of pure vegetarian excellence. Savor the authentic taste of freshly ground spices, traditional family recipes, and heartfelt hospitality.
          </p>
          
          {/* Social Icons with Branded Official Colors and smooth hover transitions */}
          <div className="flex space-x-4 pt-2">
            {/* Green Call Icon */}
            <a 
              href="tel:+919347104569" 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#2ECC71] hover:scale-110 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 active:scale-95" 
              aria-label="Call Balaji Dhaba"
            >
              <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.2c.28-.28.36-.67.25-1.02A11.36 11.36 0 018.62 4c0-.55-.45-1-1-1H4.11c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.62c0-.55-.45-1-1-1z" />
              </svg>
            </a>
            
            {/* Official WhatsApp Green */}
            <a 
              href="https://wa.me/919347104569?text=Hi%20Balaji%20Chilkur%20Family%20Dhaba!%20I'd%20like%20to%20make%20an%20inquiry." 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#25D366] hover:scale-110 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-green-600/20 active:scale-95" 
              aria-label="WhatsApp Balaji Dhaba"
            >
              <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.66.986 3.288 1.488 4.793 1.49 5.485.002 9.953-4.462 9.956-9.943.002-2.656-1.03-5.153-2.905-7.03C16.61 1.83 14.117.794 11.46.794 5.976.794 1.508 5.26 1.505 10.744c-.001 1.624.425 3.208 1.232 4.606l-.997 3.639 3.731-.978c1.378.75 2.766 1.145 3.576.743zm11.306-6.85c-.279-.14-1.647-.812-1.9-.904-.253-.092-.438-.138-.621.14-.183.279-.708.904-.868 1.088-.16.184-.32.207-.6.066-.279-.14-1.18-.435-2.247-1.388-.83-.74-1.39-1.653-1.553-1.93-.163-.279-.018-.43.12-.569.127-.123.279-.323.418-.484.14-.16.187-.274.28-.458.093-.184.047-.346-.023-.485-.07-.14-.621-1.498-.85-2.05-.224-.54-.447-.466-.621-.475-.16-.008-.344-.01-.528-.01s-.484.068-.737.346c-.253.279-.966.945-.966 2.302 0 1.358.989 2.668 1.127 2.852.138.184 1.944 2.97 4.71 4.164.658.284 1.172.454 1.572.58.66.21 1.26.18 1.733.11.528-.078 1.647-.674 1.88-1.325.233-.65.233-1.21.164-1.325-.07-.11-.253-.18-.532-.32z"/>
              </svg>
            </a>
            
            {/* Instagram Official Gradient */}
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-tr from-[#FFB900] via-[#D10176] to-[#3B199C] hover:scale-110 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/20 active:scale-95" 
              aria-label="Instagram Balaji Dhaba"
            >
              <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col space-y-4">
          <h4 className="font-display text-lg font-bold tracking-wider text-brand-bg border-b border-brand-gold/15 pb-2">
            Navigation
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/" className="hover:text-brand-gold hover:translate-x-1 transform inline-block transition-all duration-300">Home</Link>
            </li>
            <li>
              <Link href="/menu" className="hover:text-brand-gold hover:translate-x-1 transform inline-block transition-all duration-300">Our Menu</Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-brand-gold hover:translate-x-1 transform inline-block transition-all duration-300">About Us</Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-brand-gold hover:translate-x-1 transform inline-block transition-all duration-300">Contact</Link>
            </li>
          </ul>
        </div>

        {/* Dynamic Operating Hours from settings or standard fallbacks */}
        <div className="flex flex-col space-y-4">
          <h4 className="font-display text-lg font-bold tracking-wider text-brand-bg border-b border-brand-gold/15 pb-2">
            Operational Hours
          </h4>
          <ul className="space-y-4 text-xs">
            <li className="flex items-start space-x-3">
              <Clock size={16} className="text-brand-gold shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#FFFFFF]">Daily Service</p>
                <p className="mt-1 text-[#FFFFFF]/60">11:00 AM – 11:00 PM</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Contact details with gold icons and translations on hover */}
        <div className="flex flex-col space-y-4">
          <h4 className="font-display text-lg font-bold tracking-wider text-brand-bg border-b border-brand-gold/15 pb-2">
            Our Branches
          </h4>
          <ul className="space-y-4 text-[#FFFFFF]/70">
            {branches.length === 0 ? (
              <>
                <li className="flex items-start space-x-3 group">
                  <MapPin size={18} className="text-brand-gold shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                  <a 
                    href="https://www.google.com/maps/search/?api=1&query=Balaji+Santosh+Family+Dhaba+Aziz+Nagar+Himayat+Sagar+Rd+Moinabad+Telangana"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-brand-gold transition-colors block text-left group-hover:translate-x-0.5 transition-transform duration-300"
                  >
                    <p className="font-bold text-[#FFFFFF] text-sm leading-none">Moinabad Branch (Primary)</p>
                    <p className="text-xs mt-1.5 text-[#FFFFFF]/60 leading-relaxed">Aziz Nagar, Himayat Sagar Rd, Moinabad</p>
                  </a>
                </li>
                
                <li className="flex items-start space-x-3 group">
                  <MapPin size={18} className="text-brand-gold shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                  <a 
                    href="https://www.google.com/maps/search/?api=1&query=Balaji+Santosh+Family+Dhaba+Pragathi+Nagar+Kukatpally+Hyderabad"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-brand-gold transition-colors block text-left group-hover:translate-x-0.5 transition-transform duration-300"
                  >
                    <p className="font-bold text-[#FFFFFF] text-sm leading-none">PRAGATHI NAGAR BRANCH</p>
                    <p className="text-xs mt-1.5 text-[#FFFFFF]/60 leading-relaxed">Opposite Pragathi Nagar Lake, Pragathi Nagar, Kukatpally</p>
                  </a>
                </li>
                
                <li className="flex items-center space-x-3 pt-2 border-t border-[#FFFFFF]/10 group">
                  <Phone size={16} className="text-brand-gold shrink-0 group-hover:scale-110 transition-transform duration-300" />
                  <a href="tel:+919347104569" className="hover:text-brand-gold text-sm font-semibold transition-all duration-300 group-hover:translate-x-0.5 transform inline-block">+91 93471 04569</a>
                </li>
              </>
            ) : (
              <>
                {branches.map((b) => {
                  const q = encodeURIComponent(`${b.name} ${b.address}`);
                  return (
                    <li key={b.id} className="flex items-start space-x-3 group">
                      <MapPin size={18} className="text-brand-gold shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${q}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-brand-gold transition-colors block text-left group-hover:translate-x-0.5 transition-transform duration-300"
                      >
                        <p className="font-bold text-[#FFFFFF] text-sm leading-none">{b.name}</p>
                        <p className="text-xs mt-1.5 text-[#FFFFFF]/60 leading-relaxed">{b.address}</p>
                      </a>
                    </li>
                  );
                })}
                
                {branches.map((b, idx) => (
                  <li key={`phone-${b.id}`} className={`flex items-center space-x-3 pt-2 group ${idx > 0 ? '' : 'border-t border-[#FFFFFF]/10'}`}>
                    <Phone size={16} className="text-brand-gold shrink-0 group-hover:scale-110 transition-transform duration-300" />
                    <a href={`tel:${b.phone}`} className="hover:text-brand-gold text-sm font-semibold transition-all duration-300 group-hover:translate-x-0.5 transform inline-block">
                      {b.phone} ({b.name.replace(' Branch', '')})
                    </a>
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-[#FFFFFF]/10 flex flex-col sm:flex-row justify-between items-center text-xs text-[#FFFFFF]/40">
        <p>© {currentYear} Balaji Chilkur Family Dhaba. All Rights Reserved.</p>
        <p className="mt-2 sm:mt-0">Designed and Developed to Perfection.</p>
      </div>
    </footer>
  );
};
