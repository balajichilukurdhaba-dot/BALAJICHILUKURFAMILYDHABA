"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { motion, AnimatePresence } from 'framer-motion';
import { Menu as MenuIcon, X, Phone, ShoppingBag, Calendar, Home, UtensilsCrossed, Info, Image as ImageIcon, Star } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [badgeText, setBadgeText] = useState('Special Offer');
  const [badgeActive, setBadgeActive] = useState(true);
  const [badgeColor, setBadgeColor] = useState('#1E4D2B');
  const [activeHash, setActiveHash] = useState('');

  const isHomepage = pathname === '/';
  const showScrolledStyle = isScrolled || !isHomepage;

  useEffect(() => {
    async function fetchAnnouncement() {
      try {
        const res = await fetch('/api/cms/homepage');
        const data = await res.json();
        if (data.success && data.settings) {
          const sections = data.settings.homepage_sections || {};
          const bar = data.settings.announcement_bar || {};
          if (sections.announcement && bar.isActive && bar.text) {
            setAnnouncement(bar.text);
          } else {
            setAnnouncement(null);
          }

          // Fetch dynamic website configuration for booking badge
          const webSettings = data.settings.website_settings || {};
          setBadgeText(webSettings.bookingBadgeText || 'Special Offer');
          setBadgeActive(webSettings.bookingBadgeActive !== false);
          setBadgeColor(webSettings.bookingBadgeColor || '#1E4D2B');
        }
      } catch (err) {
        console.error("Failed to load navbar announcement:", err);
      }
    }
    fetchAnnouncement();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const threshold = isHomepage ? window.innerHeight - 96 : 50;
      if (window.scrollY > threshold) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // If we scroll back to the top of the homepage, clear the reviews hash highlight
      if (window.scrollY < 200 && pathname === '/') {
        setActiveHash('');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveHash(window.location.hash);
    };
    handleHashChange(); // initial check
    window.addEventListener('hashchange', handleHashChange);

    let observer: IntersectionObserver | null = null;
    const reviewsEl = document.getElementById('reviews');

    if (pathname === '/') {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveHash('#reviews');
            } else {
              setActiveHash((prev) => (prev === '#reviews' ? '' : prev));
            }
          });
        },
        { threshold: 0.2, rootMargin: '-10% 0px -10% 0px' }
      );

      if (reviewsEl) observer.observe(reviewsEl);
    } else {
      setActiveHash('');
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      if (observer && reviewsEl) observer.unobserve(reviewsEl);
    };
  }, [pathname]);

  const isLinkActive = (path: string) => {
    if (path.includes('#')) {
      const parts = path.split('#');
      const route = parts[0] || '/';
      const hash = '#' + parts[1];
      return pathname === route && activeHash === hash;
    }
    if (path === '/') {
      return pathname === '/' && !activeHash;
    }
    return pathname === path;
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Menu', path: '/menu', icon: UtensilsCrossed },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Gallery', path: '/gallery', icon: ImageIcon },
    { name: 'Reviews', path: '/#reviews', icon: Star },
    { name: 'Contact', path: '/contact', icon: Phone }
  ];

  const handleLinkClick = (path: string) => {
    setIsOpen(false);
    if (path.includes('#')) {
      const hash = '#' + path.split('#')[1];
      setActiveHash(hash);
      const elementId = path.split('#')[1];
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      setActiveHash('');
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    setIsOpen(false);
    setActiveHash('');
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          showScrolledStyle 
            ? 'glass-panel shadow-md bg-brand-bg/90 backdrop-blur-md' 
            : 'bg-transparent'
        }`}
      >


        <div className={`w-full px-6 flex justify-between items-center transition-all duration-300 ${
          isScrolled ? 'py-3' : 'py-5'
        }`}>
          {/* Logo / Brand Name */}
          <Link href="/" onClick={handleLogoClick} className="flex items-center space-x-2 md:space-x-3 group">
            <img 
              src="/bsd-logo.png" 
              alt="Balaji Chilkur Family Dhaba Logo" 
              className="w-16 h-16 md:w-[72px] md:h-[72px] object-contain"
            />
            <span className={`font-display text-xs sm:text-sm md:text-base font-bold tracking-wider uppercase transition-colors duration-300 group-hover:text-brand-gold drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] ${
              showScrolledStyle ? 'text-brand-dark' : 'text-white'
            }`}>
              BALAJI CHILUKUR FAMILY DHABA
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                onClick={() => handleLinkClick(link.path)}
                className={`relative font-sans text-sm font-medium tracking-wide uppercase transition-colors duration-300 py-1 ${
                  isLinkActive(link.path) 
                    ? 'text-brand-gold' 
                    : showScrolledStyle 
                      ? 'text-brand-dark hover:text-brand-accent'
                      : 'text-white/90 hover:text-brand-gold drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]'
                }`}
              >
                {link.name}
                {isLinkActive(link.path) && (
                  <motion.div 
                    layoutId="activeNavIndicator"
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-gold"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-5">
            <a 
              href="tel:+919347104569" 
              className={`p-2.5 rounded-full border transition-colors flex items-center justify-center ${
                showScrolledStyle
                  ? 'border-brand-dark/15 text-brand-dark hover:text-brand-accent hover:border-brand-accent'
                  : 'border-white/30 text-white hover:text-brand-gold hover:border-brand-gold'
              }`}
            >
              <Phone size={16} />
            </a>
            
            {/* Premium CTA Button with Floating Badge */}
            <div className="relative group">
              <Link 
                href="/reserve" 
                className="flex items-center space-x-2 bg-brand-gold hover:bg-brand-gold/90 text-brand-dark transition-all duration-300 text-sm font-bold uppercase tracking-wider px-6 py-3 rounded-full shadow-lg shadow-brand-gold/30 hover:scale-[1.02]"
              >
                <Calendar size={14} className="animate-pulse" />
                <span>Book a Table</span>
              </Link>
            </div>
          </div>
          
          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center space-x-3">
            <div className="relative">
              <Link 
                href="/reserve" 
                className="flex items-center space-x-1 bg-brand-gold text-brand-dark transition-colors duration-300 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full shadow-lg"
              >
                <Calendar size={12} />
                <span>Book</span>
              </Link>
            </div>
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-full transition-colors ${
                showScrolledStyle
                  ? 'text-brand-dark hover:text-brand-accent'
                  : 'text-white hover:text-brand-gold'
              }`}
            >
              {isOpen ? <X size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
            />

            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-[320px] max-w-[85vw] z-[100] bg-brand-dark text-white flex flex-col justify-between p-6 shadow-2xl overflow-y-auto lg:hidden"
            >
              <div className="flex flex-col h-full justify-between">
                <div>
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between pb-6 border-b border-white/10">
                    <div className="flex items-center space-x-2.5">
                      <img 
                        src="/bsd-logo.png" 
                        alt="Logo" 
                        className="w-12 h-12 object-contain"
                      />
                      <div className="flex flex-col">
                        <span className="font-display text-xs font-bold tracking-wider uppercase text-brand-gold">
                          Balaji Chilkur
                        </span>
                        <span className="font-sans text-[10px] text-white/60 tracking-widest uppercase">
                          Family Dhaba
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                      aria-label="Close menu"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Navigation Links */}
                  <div className="flex flex-col space-y-2 mt-8">
                    {navLinks.map((link) => {
                      const Icon = link.icon;
                      const active = isLinkActive(link.path);
                      return (
                        <Link
                          key={link.name}
                          href={link.path}
                          onClick={() => handleLinkClick(link.path)}
                          className={`flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                            active
                              ? 'bg-white/15 text-brand-gold font-semibold shadow-inner'
                              : 'text-white/80 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <Icon size={18} className={active ? 'text-brand-gold' : 'text-white/50'} />
                          <span className="font-sans text-base tracking-wide">{link.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Actions and Info */}
                <div className="flex flex-col space-y-3.5 mt-8 pt-6 border-t border-white/10">
                  <a 
                    href="tel:+919347104569" 
                    className="w-full flex justify-center items-center space-x-2 text-white border border-white/20 hover:border-white/50 py-3 rounded-xl font-sans text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:bg-white/5"
                  >
                    <Phone size={14} className="text-brand-gold animate-pulse" />
                    <span>Call +91 93471 04569</span>
                  </a>
                  
                  <Link 
                    href="/reserve" 
                    onClick={() => setIsOpen(false)}
                    className="w-full flex justify-center items-center space-x-2 bg-brand-gold text-brand-dark py-3.5 rounded-xl font-sans text-sm font-bold uppercase tracking-wider shadow-lg hover:bg-white transition-all duration-300 hover:scale-[1.02]"
                  >
                    <Calendar size={14} />
                    <span>Book a Table</span>
                  </Link>

                  <Link 
                    href="/menu" 
                    onClick={() => setIsOpen(false)}
                    className="w-full flex justify-center items-center space-x-2 bg-white/10 hover:bg-white/20 text-white py-3.5 rounded-xl font-sans text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02]"
                  >
                    <ShoppingBag size={14} />
                    <span>Order Online</span>
                  </Link>
                  
                  <p className="text-[10px] text-center text-white/40 font-sans tracking-wide pt-2">
                    Aziz Nagar - Himayat Nagar Route, Hyderabad
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
