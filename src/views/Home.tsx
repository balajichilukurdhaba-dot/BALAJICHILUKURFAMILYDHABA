"use client";
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Phone,
  Clock,
  ArrowRight,
  Star,
  X,
  Quote,
  Calendar
} from 'lucide-react';
import { DishCard } from '../components/DishCard';
import ScrollStack, { ScrollStackItem } from '../components/ScrollStack';
import { SIGNATURE_DISHES as STATIC_DISHES, GALLERY_PHOTOS as STATIC_GALLERY, TESTIMONIALS as STATIC_TESTIMONIALS } from '../utils/menuData';
import { Loader2 } from 'lucide-react';

// ─── Google Review Card ────────────────────────────────────────────────────────
interface CircularReviewCardProps {
  testimonial: any;
  onClick: () => void;
}
const CircularReviewCard: React.FC<CircularReviewCardProps> = ({ testimonial, onClick }) => {
  // Generate realistic timestamps based on review ID to vary content
  const timeLabel = testimonial.date || (testimonial.id.charCodeAt(0) % 2 === 0 ? 'a week ago' : testimonial.id.charCodeAt(0) % 3 === 0 ? '3 weeks ago' : '2 months ago');

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -3, scale: 1.01 }}
      className="w-[290px] md:w-[320px] bg-white border border-[#F5E6E3] p-5 rounded-2xl shrink-0 cursor-pointer select-none relative flex flex-col justify-between transition-all duration-300 hover:shadow-md shadow-sm font-sans"
    >
      <div>
        {/* Profile Head */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={testimonial.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'}
              alt={testimonial.name}
              className="w-9 h-9 rounded-full object-cover border border-[#F5E6E3] bg-zinc-50"
            />
            <div className="text-left">
              <h4 className="font-sans font-bold text-xs text-brand-dark leading-tight">
                {testimonial.name}
              </h4>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[9px] text-zinc-400 font-sans font-medium tracking-wide">
                  Verified Google Review
                </span>
              </div>
            </div>
          </div>

          {/* Google G Logo icon */}
          <div className="w-6 h-6 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" width="10" height="10" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
          </div>
        </div>

        {/* Stars + Date */}
        <div className="flex items-center justify-between mt-3.5">
          <div className="flex gap-0.5 text-brand-gold">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                className={i < testimonial.rating ? 'fill-current text-[#1E4D2B]' : 'text-zinc-200'}
              />
            ))}
          </div>
          <span className="text-[9px] text-zinc-400 font-sans">{timeLabel}</span>
        </div>

        {/* Review body */}
        <p className="text-[11px] font-sans text-brand-dark/75 leading-relaxed italic mt-2.5 line-clamp-3 text-left">
          "{testimonial.content}"
        </p>
      </div>

      {testimonial.role && testimonial.role !== 'Google Reviews' && testimonial.role !== 'Local Guide' && (
        <div className="mt-3.5 pt-2.5 border-t border-[#F5E6E3] flex justify-between items-center text-[9px] font-sans">
          <span className="text-zinc-400 font-bold uppercase tracking-wider">Recommended:</span>
          <span className="text-[#1E4D2B] font-extrabold">{testimonial.role}</span>
        </div>
      )}
    </motion.div>
  );
};

// ─── Review Modal popup ──────────────────────────────────────────────────────────
interface ReviewModalProps {
  testimonial: any;
  onClose: () => void;
}
const ReviewModal: React.FC<ReviewModalProps> = ({ testimonial, onClose }) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Freeze background scrolling when modal is active
  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      {/* backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        className="relative z-10 bg-[#FFFFFF] rounded-3xl p-8 md:p-10 max-w-md w-full shadow-2xl overflow-hidden border border-brand-dark/10"
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-brand-dark/10 hover:bg-brand-dark/20 text-brand-dark rounded-full p-2 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="absolute top-2 right-6 text-brand-gold/10 pointer-events-none select-none">
          <Quote size={100} />
        </div>

        <div className="text-center relative z-10">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <img
              src={testimonial.avatar}
              alt={testimonial.name}
              className="w-full h-full rounded-full object-cover border-4 border-brand-gold shadow-lg"
            />
            <span className="absolute bottom-0 right-0 bg-[#4285F4] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow border border-white">
              G
            </span>
          </div>

          <h3 className="font-display text-xl font-extrabold text-brand-dark">{testimonial.name}</h3>
          <p className="text-xs text-brand-olive font-semibold tracking-wider uppercase mt-1">
            {testimonial.role}
          </p>

          <div className="flex justify-center gap-1 my-4 text-brand-gold">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={16}
                className={i < testimonial.rating ? 'fill-current text-brand-gold' : 'text-brand-dark/20'}
              />
            ))}
          </div>

          <p className="text-sm font-sans text-brand-dark/80 italic leading-relaxed my-6 bg-brand-dark/5 p-5 rounded-2xl border border-brand-dark/5 text-left">
            "{testimonial.content}"
          </p>

          <div className="flex justify-between items-center text-[10px] font-bold text-brand-dark/50 uppercase tracking-widest pt-4 border-t border-brand-dark/5">
            <span>Posted: {testimonial.date}</span>
            <span className="bg-brand-accent/15 text-brand-accent px-3 py-1 rounded-full">
              {testimonial.source}
            </span>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

const HOME_BRANCHES = [
  {
    name: "Moinabad Branch",
    address: "4-15/2part, Aziz Nagar, Himayat Sagar Rd, Moinabad, Telangana 500075",
    phone: "+91 93471 04569",
    mapEmbedUrl: "https://maps.google.com/maps?q=Balaji%20Santosh%20Family%20Dhaba%20Aziz%20Nagar%20Himayat%20Sagar%20Rd%20Moinabad%20Telangana&t=&z=15&ie=UTF8&iwloc=&output=embed",
    mapNavUrl: "https://www.google.com/maps/search/?api=1&query=Balaji+Santosh+Family+Dhaba+Aziz+Nagar+Himayat+Sagar+Rd+Moinabad+Telangana",
    openingTime: "11:00",
    closingTime: "23:00"
  },
  {
    name: "Visit Our Second Branch – Pragathi Nagar",
    address: "Opposite Pragathi Nagar Lake, Pragathi Nagar, Kukatpally, Hyderabad, Telangana 500090",
    phone: "+91 93471 04569",
    mapEmbedUrl: "https://maps.google.com/maps?q=Balaji%20Santosh%20Family%20Dhaba%20Pragathi%20Nagar%20Kukatpally%20Hyderabad&t=&z=15&ie=UTF8&iwloc=&output=embed",
    mapNavUrl: "https://www.google.com/maps/search/?api=1&query=Balaji+Santosh+Family+Dhaba+Pragathi+Nagar+Kukatpally+Hyderabad",
    openingTime: "11:00",
    closingTime: "23:00"
  }
];

export const Home: React.FC = () => {
  const navigate = useRouter();
  const [activeBranch, setActiveBranch] = useState(0);
  const [showFounderModal, setShowFounderModal] = useState(false);
  const activeCategory = 'Starters';

  // CMS Dynamic States
  const [cmsSettings, setCmsSettings] = useState<any>(null);
  const [dishes, setDishes] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected review for details modal
  const [selectedReview, setSelectedReview] = useState<any>(null);

  const reviewsScrollRef = useRef<HTMLDivElement>(null);
  const reviewsDragRef = useRef({ isDown: false, startX: 0, scrollLeft: 0, hasDragged: false });

  const galleryScrollRef = useRef<HTMLDivElement>(null);
  const galleryDragRef = useRef({ isDown: false, startX: 0, scrollLeft: 0, hasDragged: false });

  useEffect(() => {
    async function loadCMSData() {
      try {
        const previewMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'true';

        const [settingsRes, menuRes, offersRes, testimonialsRes, galleryRes, branchesRes] = await Promise.all([
          fetch(`/api/cms/homepage?draft=${previewMode}`),
          fetch(`/api/cms/menu?cacheBust=${Date.now()}_${Math.random().toString(36).substring(7)}`, {
            cache: 'no-store',
            next: { revalidate: 0 },
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          }),
          fetch('/api/cms/offers?activeOnly=true&homepageOnly=true'),
          fetch('/api/cms/testimonials?approvedOnly=true'),
          fetch('/api/cms/gallery?featured=true'),
          fetch('/api/cms/branches')
        ]);

        const [settingsData, menuData, offersData, testimonialsData, galleryData, branchesData] = await Promise.all([
          settingsRes.json(),
          menuRes.json(),
          offersRes.json(),
          testimonialsRes.json(),
          galleryRes.json(),
          branchesRes.json()
        ]);

        if (settingsData.success) setCmsSettings(settingsData.settings);

        if (menuData.success) {
          const all: any[] = [];
          menuData.categories.forEach((cat: any) => {
            cat.dishes.forEach((d: any) => {
              if (!d.isHidden) {
                all.push({ ...d, category: cat.name });
              }
            });
          });
          setDishes(all);
        }

        if (offersData.success) setOffers(offersData.offers);
        if (testimonialsData.success) setTestimonials(testimonialsData.testimonials);
        if (galleryData.success) setGalleryPhotos(galleryData.photos);
        if (branchesData.success) setBranches(branchesData.branches);

      } catch (error) {
        console.error('Failed to load CMS data on home:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCMSData();
  }, []);



  // Reviews auto-scroll + drag-to-scroll
  useEffect(() => {
    const el = reviewsScrollRef.current;
    const drag = reviewsDragRef.current;
    if (!el) return;

    let animationFrameId: number;

    const autoScroll = () => {
      if (!drag.isDown && el) {
        el.scrollLeft += 0.5;
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);

    const onMouseDown = (e: MouseEvent) => {
      drag.isDown = true;
      drag.hasDragged = false;
      drag.startX = e.pageX - el.offsetLeft;
      drag.scrollLeft = el.scrollLeft;
    };
    const onMouseLeave = () => { drag.isDown = false; };
    const onMouseUp = () => { drag.isDown = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!drag.isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - drag.startX) * 1.5;
      if (Math.abs(walk) > 5) drag.hasDragged = true;
      el.scrollLeft = drag.scrollLeft - walk;
    };
    const onTouchStart = () => { drag.isDown = true; drag.hasDragged = false; };
    const onTouchEnd = () => { drag.isDown = false; };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('touchstart', onTouchStart);
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      cancelAnimationFrame(animationFrameId);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Gallery auto-scroll + drag-to-scroll
  useEffect(() => {
    const el = galleryScrollRef.current;
    const drag = galleryDragRef.current;
    if (!el) return;

    let animationFrameId: number;

    const autoScroll = () => {
      if (!drag.isDown && el) {
        el.scrollLeft += 3;
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);

    const onMouseDown = (e: MouseEvent) => {
      drag.isDown = true;
      drag.hasDragged = false;
      drag.startX = e.pageX - el.offsetLeft;
      drag.scrollLeft = el.scrollLeft;
    };
    const onMouseLeave = () => { drag.isDown = false; };
    const onMouseUp = () => { drag.isDown = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!drag.isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - drag.startX) * 2.5;
      if (Math.abs(walk) > 5) drag.hasDragged = true;
      el.scrollLeft = drag.scrollLeft - walk;
    };
    const onTouchStart = () => { drag.isDown = true; drag.hasDragged = false; };
    const onTouchEnd = () => { drag.isDown = false; };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('touchstart', onTouchStart);
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      cancelAnimationFrame(animationFrameId);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Use DB loaded values or fallback to static defaults
  const listDishes = dishes.length > 0 ? dishes : STATIC_DISHES.map(d => ({ ...d, isVegetarian: d.isVegetarian ?? true }));
  const filteredDishes = listDishes.filter(dish => dish.category === activeCategory).slice(0, 4);

  const listOffers = offers.length > 0 ? offers : [
    {
      id: 'online-booking-offer',
      title: '10% Off Online Bookings',
      description: 'Skip the wait and get 10% off your entire bill when you reserve a table online.',
      price: '-10%',
      badge: 'Limited Time',
      cta: 'Book Now',
      image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1000&auto=format&fit=crop',
      link: '/reserve'
    },
    {
      id: 'family-combo',
      title: 'Jumbo Family Pack',
      description: 'Perfect for 4-5 people. Includes Biryani, Curries, Rotis, and Desserts.',
      price: '₹1499',
      badge: 'Best Value',
      cta: 'Order Now',
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000&auto=format&fit=crop',
      link: '/menu?category=Combo+Family+Pack'
    }
  ];

  const listTestimonials = testimonials.length > 0 ? testimonials : STATIC_TESTIMONIALS;
  const uniqueTestimonials = React.useMemo(() => {
    const seenNames = new Set();
    const seenAvatars = new Set();
    return listTestimonials.filter(t => {
      const nameKey = t.name.toLowerCase().trim();
      const avatarKey = (t.avatar || '').toLowerCase().trim();
      if (seenNames.has(nameKey)) return false;
      seenNames.add(nameKey);

      // If avatar is repeated, we clear it so a default avatar or initials card is shown
      if (avatarKey && seenAvatars.has(avatarKey)) {
        t.avatar = '';
      }
      if (avatarKey) {
        seenAvatars.add(avatarKey);
      }
      return true;
    });
  }, [listTestimonials]);

  const listGallery = galleryPhotos.length > 0 ? galleryPhotos : STATIC_GALLERY;
  const listBranches = React.useMemo(() => {
    const rawList = branches.length > 0 ? branches : HOME_BRANCHES;
    const mapped = rawList.map(b => {
      const q = encodeURIComponent(`${b.name} ${b.address}`);
      return {
        id: b.id,
        name: b.name,
        address: b.address,
        phone: b.phone,
        mapEmbedUrl: b.mapEmbedUrl || `https://maps.google.com/maps?q=${q}&t=&z=15&ie=UTF8&iwloc=&output=embed`,
        mapNavUrl: b.mapNavUrl || `https://www.google.com/maps/search/?api=1&query=${q}`,
        openingTime: b.openingTime || "11:00",
        closingTime: b.closingTime || "23:00"
      };
    });

    // Ensure Moinabad is always first, Pragathi Nagar/others are second
    return [...mapped].sort((a, b) => {
      if (a.name.includes("Moinabad")) return -1;
      if (b.name.includes("Moinabad")) return 1;
      return 0;
    });
  }, [branches]);

  // Destructure homepage CMS settings or fallback
  const sectionsMap = cmsSettings?.homepage_sections || {
    hero: true,
    announcement: true,
    featuredDishes: true,
    offers: true,
    about: true,
    gallery: true,
    testimonials: true,
    contact: true
  };

  const heroData = cmsSettings?.homepage_hero || {
    title: "PURE VEG, SO RICH YOU WON'T MISS THE MEAT",
    subtitle: 'Experience the rich flavors of traditional pure vegetarian recipes cooked with love and passion.',
    videoUrl: 'https://res.cloudinary.com/dvueuxjap/video/upload/v1784104163/WhatsApp_Video_2026-07-14_at_6.19.52_PM_pb2lyv.mp4',
    ctaText: 'Reserve A Table',
    ctaLink: '/reserve',
    secondaryCtaText: 'Order Online',
    secondaryCtaLink: '/menu'
  };

  const announcementData = cmsSettings?.announcement_bar || {
    text: '🎉 Special Offer: Flat 10% Off on Table Bookings Online! Show your QR code at the counter.',
    isActive: true
  };

  // Rotating slideshow for About section restaurant photos
  const aboutImages = [
    '/dhaba-exterior.jpg',
    '/dhaba-interior-booths.jpg',
    '/dhaba-interior-dining.jpg',
    '/dhaba-interior-reception.jpg'
  ];
  const [currentAboutImageIndex, setCurrentAboutImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAboutImageIndex((prev) => (prev + 1) % aboutImages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const aboutData = cmsSettings?.homepage_about || {
    heading: 'Our Culinary Journey',
    subheading: 'A Legacy of Pure Vegetarian Excellence Since 1999',
    content: 'At Balaji Chilkur Family Dhaba, we bring you the finest flavors of North & South Indian cuisine. Our dishes are prepared by expert chefs using the freshest local produce and pure spices. Perfect for family dining, farm events, and travelers looking for a premium dining stop.',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    isActive: true
  };

  const mappedOffers = React.useMemo(() => {
    return listOffers.map(offer => {
      const isBookingOffer =
        offer.id === 'online-booking-offer' ||
        offer.link?.includes('reserve') ||
        offer.link?.includes('book') ||
        offer.title?.toLowerCase().includes('book') ||
        offer.title?.toLowerCase().includes('reserve');

      return {
        ...offer,
        isBooking: isBookingOffer
      };
    });
  }, [listOffers]);

  return (
    <div className="relative bg-brand-bg noise-overlay min-h-screen">



      {/* 1. HERO SECTION */}
      {sectionsMap.hero && (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white p-2 md:p-3">
          {/* Full-Screen Background Video — all devices */}
          <div className="absolute inset-2 md:inset-3 z-0 overflow-hidden rounded-3xl bg-brand-dark">
            {/* Fallback background colour while video loads */}
            <div className="absolute inset-0 bg-brand-dark rounded-3xl" />

            {/* YouTube Video or MP4 video */}
            {heroData.videoUrl?.includes('.mp4') || heroData.videoUrl?.includes('video/upload') ? (
              <video
                src={heroData.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                onCanPlay={(e) => {
                  e.currentTarget.playbackRate = 1.35;
                }}
                className="w-full h-full object-cover opacity-100 absolute inset-0"
              />
            ) : (
              <iframe
                src={heroData.videoUrl}
                title="Balaji Santosh Family Dhaba Background Video"
                allow="autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{
                  border: 'none',
                  pointerEvents: 'none',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) scale(1.05)',
                  width: '100vw',
                  height: '177.78vw',
                  minWidth: '56.25vh',
                  minHeight: '100vh',
                }}
                className="opacity-95"
              />
            )}

            {/* Premium luxury dark radial gradient overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.05)_0%,_rgba(0,0,0,0.25)_60%,_rgba(0,0,0,0.55)_100%)]" />
          </div>

          {/* Hero Content Overlay */}
          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center pt-20">
            <span className="text-[#FFFFFF] text-[9px] font-bold uppercase tracking-[0.25em] bg-brand-accent/20 border border-brand-accent/40 px-5 py-2 rounded-full backdrop-blur-md mb-8 animate-pulse font-sans">
              Balaji Chilkur Family Dhaba
            </span>
            <h1 className="font-display text-4xl md:text-7xl font-semibold text-[#FFFFFF] leading-tight drop-shadow-2xl uppercase tracking-wider">
              {heroData.title}
            </h1>
            <p className="text-xs md:text-sm text-[#FFFFFF]/70 font-sans uppercase tracking-[0.15em] max-w-2xl mx-auto leading-loose mt-6 drop-shadow-md">
              {heroData.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-5 mt-12">
              <Link
                href={heroData.ctaLink}
                className="w-full sm:w-auto bg-brand-accent hover:bg-brand-accent/90 text-[#FFFFFF] px-8 py-4.5 rounded-full font-bold uppercase tracking-wider shadow-lg shadow-brand-accent/25 transition-all text-xs block"
              >
                {heroData.ctaText}
              </Link>
              <Link
                href={heroData.secondaryCtaLink}
                className="w-full sm:w-auto bg-transparent hover:bg-[#FFFFFF]/10 border-2 border-[#FFFFFF] text-[#FFFFFF] px-8 py-4.5 rounded-full font-bold uppercase tracking-wider transition-all text-xs block"
              >
                {heroData.secondaryCtaText}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 2. FEATURED DISHES SECTION */}
      {sectionsMap.featuredDishes && (
        <section className="pt-24 pb-8 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Signature Selection</span>
            <h2 className="font-display text-3xl md:text-5xl font-black text-brand-dark mt-3">
              Delicious Pure Vegetarian Cuisine
            </h2>
            <p className="text-brand-dark/70 font-sans text-sm md:text-base mt-4">
              Select a category below to explore our delicious Indian vegetarian options, freshly prepared with quality ingredients.
            </p>
          </div>

          {/* Grid display of signature dishes - Stack animation on mobile, standard grid on desktop */}
          {isMobileView ? (
            <div className="px-1">
              <ScrollStack
                itemDistance={50}
                itemScale={0.04}
                itemStackDistance={15}
                stackPosition="25%"
                scaleEndPosition="10%"
                baseScale={0.85}
                useWindowScroll={true}
              >
                {filteredDishes.map((dish) => (
                  <ScrollStackItem key={dish.id}>
                    <DishCard dish={dish} isCompact={true} />
                  </ScrollStackItem>
                ))}
              </ScrollStack>
            </div>
          ) : (
            <div className="max-w-7xl xl:max-w-[960px] mx-auto">
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {filteredDishes.map((dish) => (
                    <motion.div
                      key={dish.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <DishCard dish={dish} isCompact={true} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}

          {/* Explore Full Menu Button */}
          <div className="flex justify-center mt-12">
            <Link
              href="/menu"
              className="bg-brand-accent hover:bg-brand-accent/90 text-[#FFFFFF] px-8 py-4 rounded-full font-bold uppercase tracking-wider shadow-lg shadow-brand-accent/25 transition-all text-sm flex items-center justify-center space-x-2"
            >
              <span>Explore Full Menu</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}


      {/* 4. SPECIAL OFFERS SECTION */}
      {sectionsMap.offers && (
        <section className="pt-12 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1E4D2B] font-display">Exclusive Indulgence</span>
            <h2 className="font-display text-3xl md:text-5xl font-semibold text-brand-dark mt-3">
              Limited Time Promotions
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {mappedOffers.map((offer) => (
              <div
                key={offer.id}
                onClick={() => navigate.push(offer.link)}
                className="relative rounded-3xl overflow-hidden min-h-[320px] flex items-center bg-zinc-950 text-[#FFFFFF] group cursor-pointer border border-brand-gold/10 hover:border-brand-gold/25 transition-all duration-500 shadow-md hover-lift"
              >
                {/* Offer Image */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
                </div>

                {/* Offer Content */}
                <div className="relative z-10 p-8 md:p-12 max-w-md">
                  <span className="text-[9px] font-bold uppercase tracking-widest bg-brand-gold/20 border border-brand-gold/45 text-brand-gold px-3 py-1 rounded-md">
                    {offer.badge}
                  </span>
                  <h3 className="font-display text-2xl md:text-3xl font-semibold mt-5 text-[#FFFFFF] tracking-wide">
                    {offer.title}
                  </h3>
                  <p className="text-xs text-[#FFFFFF]/70 mt-3 font-sans leading-relaxed">
                    {offer.description}
                  </p>

                  <div className="flex items-center space-x-6 mt-8">
                    {offer.isBooking ? (
                      <div className="w-12 h-12 rounded-full border border-brand-gold/30 flex items-center justify-center text-brand-gold bg-brand-gold/5 shrink-0">
                        <Calendar size={18} className="animate-pulse" />
                      </div>
                    ) : (
                      <span className="font-display text-2xl font-black text-brand-gold">
                        {offer.price}
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate.push(offer.link);
                      }}
                      className="text-[10px] font-bold uppercase tracking-widest bg-brand-gold hover:bg-brand-accent text-brand-dark hover:text-[#FFFFFF] px-6 py-3.5 rounded-full transition-colors duration-300 shadow-md"
                    >
                      {offer.cta}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. ABOUT SECTION */}
      {sectionsMap.about && aboutData.isActive && (
        <section className="py-24 bg-[#ECE3D4]/50 border-y border-brand-dark/5 px-6 md:px-12 overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Image Column */}
            {/* Left Image Column - Rotating Slideshow Box */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="lg:col-span-6 xl:col-span-5 relative rounded-3xl overflow-hidden aspect-[4/3] shadow-xl border-4 border-white bg-brand-dark/5"
            >
              <div className="relative w-full h-full">
                <AnimatePresence>
                  <motion.img
                    key={currentAboutImageIndex}
                    src={aboutImages[currentAboutImageIndex]}
                    alt="Balaji Chilkur Family Dhaba Gallery"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.0, ease: "easeInOut" }}
                    className="w-full h-full object-cover absolute inset-0"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-black/10 pointer-events-none" />

                {/* Visual indicators/dots for slider */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 select-none">
                  {aboutImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentAboutImageIndex(idx)}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentAboutImageIndex ? 'bg-white w-4.5' : 'bg-white/50 hover:bg-white/85'
                        }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Animated Founder Trigger Badge */}
                <motion.div
                  className="absolute bottom-4 right-4 z-20 cursor-pointer"
                  animate={{
                    y: [0, -6, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <motion.button
                    onClick={() => setShowFounderModal(true)}
                    className="group relative flex items-center space-x-2 bg-brand-accent/95 hover:bg-brand-accent text-white px-4 py-2.5 rounded-full shadow-lg border border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 select-none"
                    whileHover={{
                      boxShadow: "0 0 20px rgba(46, 204, 113, 0.4)",
                    }}
                  >
                    {/* Animated Steam Pot icon */}
                    <span className="relative flex h-6 w-6 items-center justify-center text-lg filter drop-shadow">
                      🍲
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[9px] animate-bounce opacity-75">💨</span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider font-display">Meet the Founder</span>
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Content Column */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-[#1E4D2B] font-display">Pure vegetarian heritage</span>
              <h2 className="font-display text-3xl md:text-5xl font-semibold text-brand-dark mt-3 leading-tight tracking-wide">
                {(!aboutData.heading || aboutData.heading === 'Our Culinary Journey') ? 'A Tradition of Pure Vegetarian Excellence' : aboutData.heading}
              </h2>

              <div className="space-y-4 mt-6">
                <p className="text-brand-dark/95 font-display text-lg md:text-xl font-medium leading-relaxed">
                  Crafted with passion and a deep respect for heritage, our restaurant stands as a premier destination for those who appreciate the true artistry of pure vegetarian dining. We invite families, travelers, and food connoisseurs to embark on a flavorful journey featuring the finest North and South Indian culinary traditions.
                </p>
                <p className="text-brand-dark/70 font-sans text-xs md:text-sm leading-loose">
                  For over two decades, our kitchen has been dedicated to preserving the rich, authentic heritage of traditional recipes. By sourcing the finest seasonal ingredients and hand-grinding our signature spice blends daily, we ensure that every clay-oven specialty and slow-simmered curry is a masterpiece of taste, quality, and hospitality.
                </p>
              </div>

              {/* Elegant highlights grid with stagger loading entry */}
              <div className="grid grid-cols-2 gap-3.5 mt-8">
                {[
                  { icon: '✔', label: '100% Pure Vegetarian' },
                  { icon: '🌿', label: 'Fresh Ingredients' },
                  { icon: '👨‍👩‍👧', label: 'Family Friendly' },
                  { icon: '🚗', label: 'Spacious Parking' },
                  { icon: '✨', label: 'Premium Dining Experience' },
                  { icon: '⭐', label: 'Highly Rated' }
                ].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
                    className="flex items-center space-x-2.5 bg-white p-3.5 rounded-2xl border border-brand-gold/15 shadow-sm hover:scale-[1.02] transition-all duration-300 hover:border-brand-gold/30 select-none"
                  >
                    <span className="text-base shrink-0">{h.icon}</span>
                    <span className="text-xs font-bold text-brand-dark/85 font-sans tracking-wide">{h.label}</span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-10">
                <Link
                  href="/about"
                  className="inline-flex items-center space-x-2 text-sm font-bold uppercase tracking-widest text-[#1E4D2B] hover:text-brand-dark transition-colors duration-300"
                >
                  <span>Our Story</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Founder Story Modal */}
          <AnimatePresence>
            {showFounderModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-lg select-none"
                onClick={() => setShowFounderModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 50 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="bg-[#FAF6EE] max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl border border-brand-gold/25 relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header decoration */}
                  <div className="bg-[#1E4D2B] p-6 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FFF_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    
                    {/* Animated veg bowl floating out */}
                    <motion.div
                      initial={{ y: 30, scale: 0.5, rotate: -45 }}
                      animate={{ y: 0, scale: 1, rotate: 0 }}
                      transition={{ type: "spring", delay: 0.1, duration: 0.8 }}
                      className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-3xl mx-auto border border-white/20 shadow-inner"
                    >
                      🍲
                    </motion.div>
                    <h3 className="font-display font-black text-xl text-[#FFFFFF] mt-4 tracking-wider uppercase">Our Founder's Vision</h3>
                    <p className="text-[#90EE90] font-sans text-xs uppercase tracking-widest mt-1 font-bold">The Journey of Flavor Since 2018</p>
                  </div>

                  {/* Modal content */}
                  <div className="p-8 space-y-6">
                    <div className="space-y-4">
                      <p className="text-brand-dark/95 font-display text-base md:text-lg font-medium leading-relaxed text-center italic">
                        "A passionate dream born in 2018, realized as a sanctuary of pure vegetarian heritage in 2021."
                      </p>
                      <p className="text-brand-dark/75 font-sans text-xs md:text-sm leading-relaxed text-center">
                        Our founder’s deep passion for starting a restaurant began in 2018, fueled by a desire to create welcoming spaces where families and friends could bond over pure, traditional flavors. After years of careful planning, dedication, and culinary research, he successfully launched his own restaurant in 2021.
                      </p>
                    </div>

                    {/* Creative Timeline */}
                    <div className="relative border-t border-brand-dark/5 pt-6 grid grid-cols-2 gap-4">
                      <div className="text-center relative">
                        <div className="w-10 h-10 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto text-lg font-bold font-display border border-brand-gold/20 shadow-sm mb-2">
                          2018
                        </div>
                        <h4 className="font-display font-bold text-xs text-brand-dark">The Passion Begins</h4>
                        <p className="text-[10px] text-brand-dark/60 mt-1 leading-snug">Inspired to build a premium pure veg dining concept.</p>
                      </div>
                      
                      <div className="text-center relative">
                        <div className="absolute left-0 top-5 -translate-x-1/2 w-4 h-0.5 bg-brand-gold/25 hidden md:block"></div>
                        <div className="w-10 h-10 bg-brand-accent/10 text-[#1E4D2B] rounded-full flex items-center justify-center mx-auto text-lg font-bold font-display border border-brand-accent/20 shadow-sm mb-2">
                          2021
                        </div>
                        <h4 className="font-display font-bold text-xs text-[#1E4D2B]">The Foundation</h4>
                        <p className="text-[10px] text-brand-dark/60 mt-1 leading-snug">Launched the flagship Balaji Chilkur Family Dhaba.</p>
                      </div>
                    </div>
                  </div>

                  {/* Modal footer */}
                  <div className="px-8 pb-8 pt-2 flex justify-center">
                    <button
                      onClick={() => setShowFounderModal(false)}
                      className="px-6 py-2.5 bg-brand-dark hover:bg-brand-dark/95 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
                    >
                      Close Story
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* 6. PHOTO GALLERY SECTION */}
      {sectionsMap.gallery && (
        <section className="py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Visual feast</span>
              <h2 className="font-display text-3xl md:text-5xl font-black text-brand-dark mt-3">
                Capturing Culinary Art
              </h2>
            </div>
            <Link
              href="/gallery"
              className="group inline-flex items-center space-x-2 text-sm font-bold uppercase tracking-widest text-brand-accent mt-4 md:mt-0"
            >
              <span>View Full Gallery</span>
              <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {/* Draggable & Scrollable Auto-Scrolling Gallery Container */}
          <div 
            ref={galleryScrollRef}
            className="relative w-full flex overflow-x-auto py-4 no-scrollbar cursor-grab active:cursor-grabbing select-none"
            style={{ scrollSnapType: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex space-x-6 shrink-0">
              {(() => {
                // Drop duplicate photo entries entirely by tracking seen URLs or IDs
                const seen = new Set();
                const uniqueGallery = listGallery.filter(photo => {
                  const key = (photo.src || photo.id || '').toString().toLowerCase().trim();
                  if (!key) return false;
                  if (seen.has(key)) return false;
                  seen.add(key);
                  return true;
                });

                // Double rendering to form seamless looping marquee
                return [...uniqueGallery, ...uniqueGallery].map((photo, index) => (
                  <div
                    key={`${photo.id || photo.src}-${index}`}
                    className="relative overflow-hidden rounded-2xl bg-brand-dark group aspect-square w-56 md:w-64 shrink-0 shadow-md block cursor-pointer"
                    onClick={() => {
                      if (!galleryDragRef.current.hasDragged) {
                        navigate.push('/gallery');
                      }
                    }}
                  >
                    <img
                      src={photo.src}
                      alt={photo.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-brand-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <p className="font-display font-bold text-[#FFFFFF] text-base leading-tight">
                        {photo.title}
                      </p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </section>
      )}

      {/* 7. TESTIMONIALS SECTION */}
      {sectionsMap.testimonials && (
        <section id="reviews" className="py-24 bg-[#ECE3D4]/50 border-t border-brand-dark/5 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-12 mb-16">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Verified Feedback</span>
              <h2 className="font-display text-3xl md:text-5xl font-black text-brand-dark mt-3">
                Words From Our Patrons
              </h2>
              <p className="text-xs text-brand-dark/50 uppercase tracking-widest font-semibold mt-2">
                Click any review card to read the full patron feedback
              </p>
            </div>
          </div>

          {/* Draggable & Scrollable Auto-Scrolling Reviews */}
          <div
            ref={reviewsScrollRef}
            className="relative w-full flex overflow-x-auto py-6 no-scrollbar cursor-grab active:cursor-grabbing select-none"
            style={{ scrollSnapType: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex space-x-8 shrink-0">
              {/* Duplicated array to allow seamless scrolling loop */}
              {[...uniqueTestimonials, ...uniqueTestimonials].map((testimonial, index) => (
                <CircularReviewCard
                  key={`${testimonial.id}-${index}`}
                  testimonial={testimonial}
                  onClick={() => {
                    if (!reviewsDragRef.current.hasDragged) {
                      setSelectedReview(testimonial);
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {/* Review Lightbox Portal Modal */}
          <AnimatePresence>
            {selectedReview && (
              <ReviewModal
                testimonial={selectedReview}
                onClose={() => setSelectedReview(null)}
              />
            )}
          </AnimatePresence>
        </section>
      )}

      {/* 8. LOCATION & MAP SECTION */}
      {sectionsMap.contact && listBranches.length > 0 && (
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          {/* Section heading */}
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Our Locations</span>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-brand-dark mt-2">Find Us Near You</h2>
            <p className="text-sm text-brand-dark/55 mt-3 max-w-xs mx-auto leading-relaxed">Two welcoming branches, one family experience.</p>
          </div>

          {/* Branch Switcher animated premium cards */}
          <div className="flex flex-wrap gap-4 justify-center max-w-2xl mx-auto mb-12">
            {listBranches.map((branch, idx) => {
              const isActive = activeBranch === idx;
              return (
                <div
                  key={branch.id || idx}
                  onClick={() => setActiveBranch(idx)}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(212,175,55,0.12)';
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#90EE90';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(30,20,10,0.10)';
                    }
                  }}
                  className="cursor-pointer rounded-full border flex items-center justify-center transition-all duration-300 h-12 px-6"
                  style={{
                    background: isActive ? '#FFF9F2' : '#ffffff',
                    borderColor: isActive ? '#90EE90' : 'rgba(30,20,10,0.10)',
                    boxShadow: isActive
                      ? '0 0 0 1.5px #90EE90, 0 6px 20px rgba(212,175,55,0.12)'
                      : '0 2px 8px rgba(0,0,0,0.03)',
                    transform: 'translateY(0)',
                  } as React.CSSProperties}
                >
                  <h3
                    className="font-display font-bold tracking-wide flex items-center justify-center gap-1.5 transition-colors duration-300 select-none"
                    style={{
                      fontSize: '0.85rem',
                      color: isActive ? '#1E4D2B' : '#4a3728',
                      letterSpacing: '0.03em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span className="text-xs transition-opacity duration-300" style={{ opacity: isActive ? 1 : 0, width: isActive ? 'auto' : 0, overflow: 'hidden' }}>📍</span>
                    {branch.name}
                  </h3>
                </div>
              );
            })}
          </div>

          {(() => {
            const currentBranch = listBranches[activeBranch] || listBranches[0] || {};
            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Map Contact Card */}
                <div className="lg:col-span-5 flex flex-col justify-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Visit Us</span>
                  <h2 className="font-display text-3xl md:text-4xl font-extrabold text-brand-dark mt-3">
                    Welcome to {currentBranch.name}
                  </h2>

                  <div className="space-y-6 mt-8">
                    {/* Address */}
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-brand-accent/10 text-brand-accent rounded-full mt-1">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-brand-dark uppercase text-sm tracking-wider">Address</h4>
                        <a href={currentBranch.mapNavUrl} target="_blank" rel="noreferrer" className="text-sm text-brand-dark/70 mt-1 underline hover:text-brand-accent leading-relaxed">
                          {currentBranch.address}
                        </a>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-brand-accent/10 text-brand-accent rounded-full mt-1">
                        <Phone size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-brand-dark uppercase text-sm tracking-wider">Phone</h4>
                        <a href={`tel:${currentBranch.phone?.replace(/\s+/g, '')}`} className="text-sm text-brand-dark hover:text-brand-accent font-semibold transition-colors mt-1 block">
                          {currentBranch.phone}
                        </a>
                      </div>
                    </div>

                    {/* Hours */}
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-brand-accent/10 text-brand-accent rounded-full mt-1">
                        <Clock size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-brand-dark uppercase text-sm tracking-wider">Operating Hours</h4>
                        <p className="text-sm text-brand-dark/70 mt-1">
                          Daily Operation: {currentBranch.openingTime || '11:00'} – {currentBranch.closingTime || '23:00'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-8">
                    <a
                      href={currentBranch.mapNavUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-brand-accent hover:bg-brand-accent/90 text-brand-bg px-6 py-3.5 rounded-full font-bold uppercase tracking-wider text-xs shadow-md transition-colors text-center"
                    >
                      Google Maps Navigation
                    </a>
                    <a
                      href={currentBranch.mapNavUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-brand-dark/20 hover:border-brand-accent text-brand-dark hover:text-brand-accent px-6 py-3.5 rounded-full font-bold uppercase tracking-wider text-xs transition-colors text-center"
                    >
                      Get Directions
                    </a>
                  </div>
                </div>

                {/* Embedded Styled Map simulation */}
                <div className="lg:col-span-7 h-[450px] w-full rounded-2xl overflow-hidden border border-brand-dark/15 shadow-lg relative bg-brand-dark/5">
                  <iframe
                    title={`${currentBranch.name} Location Map`}
                    src={currentBranch.mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                  />
                </div>
              </div>
            );
          })()}
        </section>
      )}

    </div>
  );
};
