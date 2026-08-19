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
  Calendar,
  UtensilsCrossed,
  Info,
  Search,
  MessageSquare,
  CheckCircle2,
  Leaf,
  Users,
  Car,
  Sparkles,
  Images,
  BookOpen,
  Loader2
} from 'lucide-react';
import { DishCard, formatImageUrl, getFallbackFoodImage } from '../components/DishCard';
import ScrollStack, { ScrollStackItem } from '../components/ScrollStack';
import { SIGNATURE_DISHES as STATIC_DISHES, GALLERY_PHOTOS as STATIC_GALLERY, TESTIMONIALS as STATIC_TESTIMONIALS } from '../utils/menuData';

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
          <div className="flex gap-0.5 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                className={i < testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'}
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

          <div className="flex justify-center gap-1 my-4 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={18}
                className={i < testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'}
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

// ─── Submit Customer Review Modal ────────────────────────────────────────────────
interface SubmitReviewModalProps {
  onClose: () => void;
}

const SubmitReviewModal: React.FC<SubmitReviewModalProps> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Dine-in Customer');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      setErrorMsg('Please enter your name and review text.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/cms/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim() || 'Valued Customer',
          content: content.trim(),
          rating,
          source: 'Website Customer Review',
          isApproved: false
        })
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(data.error || 'Failed to submit review. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Exceptional!'];

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        className="relative z-10 bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl overflow-hidden border border-brand-dark/10 font-sans"
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-brand-dark/5 hover:bg-brand-dark/15 text-brand-dark rounded-full p-2 transition-colors"
        >
          <X size={16} />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="font-display text-xl font-extrabold text-brand-dark">Review Submitted!</h3>
            <p className="text-xs text-brand-dark/70 font-sans leading-relaxed px-2">
              Thank you for reviewing Balaji Dhaba! Your feedback has been sent to our management for approval and will appear on our website once accepted.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent/90 text-white font-bold text-xs uppercase tracking-wider shadow-md"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-5 text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-accent flex items-center gap-1.5 mb-1">
                <MessageSquare size={12} /> Share Your Experience
              </span>
              <h3 className="font-display text-xl font-extrabold text-brand-dark">Rate & Review Our Restaurant</h3>
              <p className="text-xs text-brand-dark/60 mt-1">Your review will be sent to admin for approval.</p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-sans">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Star Rating selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/70 mb-1.5">
                  Overall Rating *
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          size={24}
                          className={(hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-amber-600 ml-2 font-mono">
                    {ratingLabels[hoverRating || rating]}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/70 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-brand-dark/5 border border-brand-dark/10 rounded-xl px-3.5 py-2.5 text-xs text-brand-dark focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/70 mb-1">
                  Visit Type / Tag (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dine-in Customer, Family Dinner, Regular Patron"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-brand-dark/5 border border-brand-dark/10 rounded-xl px-3.5 py-2.5 text-xs text-brand-dark focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/70 mb-1">
                  Your Review / Feedback *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share your experience about food quality, taste, and hospitality..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-brand-dark/5 border border-brand-dark/10 rounded-xl px-3.5 py-2.5 text-xs text-brand-dark focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-brand-dark/15 text-brand-dark/70 hover:bg-brand-dark/5 text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent/90 text-white text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-2 border border-brand-accent/30 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
};

const HOME_BRANCHES = [
  {
    name: "Moinabad Branch",
    address: "4-15/2part, Aziz Nagar, Himayat Sagar Rd, Moinabad, Telangana 500075",
    phone: "+91 98494 98681",
    mapEmbedUrl: "https://maps.google.com/maps?q=Balaji%20Santosh%20Family%20Dhaba%20Aziz%20Nagar%20Himayat%20Sagar%20Rd%20Moinabad%20Telangana&t=&z=15&ie=UTF8&iwloc=&output=embed",
    mapNavUrl: "https://www.google.com/maps/search/?api=1&query=Balaji+Santosh+Family+Dhaba+Aziz+Nagar+Himayat+Sagar+Rd+Moinabad+Telangana",
    openingTime: "11:00",
    closingTime: "23:00"
  },
  {
    name: "Visit Our Second Branch – Pragathi Nagar",
    address: "Opposite Pragathi Nagar Lake, Pragathi Nagar, Kukatpally, Hyderabad, Telangana 500090",
    phone: "+91 98494 98681",
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
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [viewOfferDishesModal, setViewOfferDishesModal] = useState<{ title: string; dishes: string[]; price?: string } | null>(null);
  const [offerDishSearch, setOfferDishSearch] = useState('');
  const [modalSelectedCategory, setModalSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    if (viewOfferDishesModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.documentElement.style.overflow = '';
    };
  }, [viewOfferDishesModal]);

  const reviewsScrollRef = useRef<HTMLDivElement>(null);
  const reviewsDragRef = useRef({ isDown: false, startX: 0, scrollLeft: 0, hasDragged: false });

  const galleryScrollRef = useRef<HTMLDivElement>(null);
  const galleryDragRef = useRef({ isDown: false, startX: 0, scrollLeft: 0, hasDragged: false });

  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  const safeFetchJson = async (url: string) => {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  const loadCMSData = React.useCallback(async (isFocusTrigger = false) => {
    const now = Date.now();
    if (isFocusTrigger && now - lastFetchTimeRef.current < 10000) {
      return;
    }
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    try {
      const previewMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'true';
      const cacheBust = `${now}_${Math.random().toString(36).substring(7)}`;

      const [settingsData, menuData, offersData, testimonialsData, galleryData, branchesData] = await Promise.all([
        safeFetchJson(`/api/cms/homepage?draft=${previewMode}&t=${cacheBust}`),
        safeFetchJson(`/api/cms/menu?cacheBust=${cacheBust}`),
        safeFetchJson(`/api/cms/offers?activeOnly=true&homepageOnly=true&t=${cacheBust}`),
        safeFetchJson(`/api/cms/testimonials?approvedOnly=true&t=${cacheBust}`),
        safeFetchJson(`/api/cms/gallery?featured=true&t=${cacheBust}`),
        safeFetchJson(`/api/cms/branches?t=${cacheBust}`)
      ]);

      if (settingsData?.success) setCmsSettings(settingsData.settings);

      if (menuData?.success && Array.isArray(menuData.categories)) {
        const all: any[] = [];
        menuData.categories.forEach((cat: any) => {
          if (Array.isArray(cat.dishes)) {
            cat.dishes.forEach((d: any) => {
              if (!d.isHidden) {
                all.push({ ...d, category: cat.name });
              }
            });
          }
        });
        setDishes(all);
      }

      if (offersData?.success && Array.isArray(offersData.offers)) setOffers(offersData.offers);
      if (testimonialsData?.success && Array.isArray(testimonialsData.testimonials)) setTestimonials(testimonialsData.testimonials);
      if (galleryData?.success && Array.isArray(galleryData.photos)) setGalleryPhotos(galleryData.photos);
      if (branchesData?.success && Array.isArray(branchesData.branches)) setBranches(branchesData.branches);

    } catch (error) {
      console.warn('Failed to load CMS data on home:', error);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCMSData(false);

    // BroadcastChannel: instant cross-tab invalidation whenever Admin saves
    const channels: BroadcastChannel[] = [];
    ['menu-updates', 'gallery-updates', 'offers-updates', 'homepage-updates'].forEach((channelName) => {
      try {
        const channel = new BroadcastChannel(channelName);
        channel.onmessage = () => loadCMSData(false);
        channels.push(channel);
      } catch { /* old browsers */ }
    });

    const handleFocus = () => loadCMSData(true);
    window.addEventListener('focus', handleFocus);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadCMSData(true);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      channels.forEach(ch => ch.close());
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadCMSData]);

  // Immediate smooth scrolling on hash navigation (e.g. /#reviews)
  useEffect(() => {
    const scrollToHash = () => {
      if (typeof window !== 'undefined' && window.location.hash) {
        const id = window.location.hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    scrollToHash();
    const t1 = setTimeout(scrollToHash, 150);
    const t2 = setTimeout(scrollToHash, 500);

    window.addEventListener('hashchange', scrollToHash);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('hashchange', scrollToHash);
    };
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
  // Signature dishes = ONLY dishes explicitly marked as isRecommended (Signature) by admin
  const filteredDishes = listDishes.filter(dish => dish.isRecommended === true && !dish.isHidden);

  const DEFAULT_OFFERS = React.useMemo(() => [
    {
      id: 'online-booking-offer',
      title: '10% Off Online Bookings',
      description: 'Skip the wait and get 10% off your entire bill when you reserve a table online.',
      price: '-10%',
      badge: 'Limited Time',
      cta: 'Book Now',
      image: '/online-booking-offer.jpg',
      link: '/reserve'
    },
    {
      id: 'family-combo',
      title: 'Jumbo Family Pack',
      description: 'Perfect for 4-5 people. Includes Biryani, Curries, Rotis, and Desserts.',
      price: '₹1499',
      badge: 'Best Value',
      cta: 'Order Now',
      image: '/jumbo-family-pack.jpg',
      link: '/menu?category=Combo+Family+Pack'
    }
  ], []);

  const listOffers = offers.length > 0 ? offers : DEFAULT_OFFERS;

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
          <div className="absolute inset-2 md:inset-3 z-0 overflow-hidden rounded-3xl bg-brand-dark pointer-events-none">
            {/* Fallback background colour while video loads */}
            <div className="absolute inset-0 bg-brand-dark rounded-3xl pointer-events-none" />

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
                className="w-full h-full object-cover opacity-100 absolute inset-0 pointer-events-none"
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
                className="opacity-95 pointer-events-none"
              />
            )}

            {/* Premium luxury dark radial gradient overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.05)_0%,_rgba(0,0,0,0.25)_60%,_rgba(0,0,0,0.55)_100%)] pointer-events-none" />
          </div>

          {/* Hero Content Overlay */}
          <div className="relative z-20 text-center px-6 max-w-4xl mx-auto flex flex-col items-center pt-20 pointer-events-auto">
            <span className="text-[#FFFFFF] text-[9px] font-bold uppercase tracking-[0.25em] bg-brand-accent/20 border border-brand-accent/40 px-5 py-2 rounded-full backdrop-blur-md mb-8 animate-pulse font-sans select-none">
              Balaji Chilkur Family Dhaba
            </span>
            <h1 className="font-display text-4xl md:text-7xl font-semibold text-[#FFFFFF] leading-tight drop-shadow-2xl uppercase tracking-wider">
              {heroData.title}
            </h1>
            <p className="text-xs md:text-sm text-[#FFFFFF]/70 font-sans uppercase tracking-[0.15em] max-w-2xl mx-auto leading-loose mt-6 drop-shadow-md">
              {heroData.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-8 sm:mt-10 relative z-30 w-full max-w-xl mx-auto">
              <Link
                href={heroData.ctaLink || '/reserve'}
                onClick={() => navigate.push(heroData.ctaLink || '/reserve')}
                className="w-auto min-w-[190px] sm:min-w-[230px] px-5 py-3 sm:px-8 sm:py-4 bg-[#1E4D2B] hover:bg-[#163820] text-white rounded-full font-sans font-bold uppercase tracking-wider text-[11px] sm:text-xs md:text-sm shadow-xl shadow-black/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 inline-flex items-center justify-center gap-2 sm:gap-2.5 border border-white/20 cursor-pointer select-none text-center"
              >
                <Calendar size={16} className="text-brand-gold shrink-0 sm:w-[18px] sm:h-[18px]" />
                <span>{heroData.ctaText || 'Reserve A Table'}</span>
              </Link>
              <Link
                href={heroData.secondaryCtaLink || '/menu'}
                onClick={() => navigate.push(heroData.secondaryCtaLink || '/menu')}
                className="w-auto min-w-[190px] sm:min-w-[230px] px-5 py-3 sm:px-8 sm:py-4 bg-white/10 hover:bg-white/25 active:scale-95 text-white rounded-full font-sans font-bold uppercase tracking-wider text-[11px] sm:text-xs md:text-sm backdrop-blur-md border-2 border-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 inline-flex items-center justify-center gap-2 sm:gap-2.5 cursor-pointer select-none text-center"
              >
                <UtensilsCrossed size={16} className="text-white shrink-0 sm:w-[18px] sm:h-[18px]" />
                <span>{heroData.secondaryCtaText || 'Order Online'}</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 2. SIGNATURE DISHES SECTION */}
      {sectionsMap.featuredDishes && filteredDishes.length > 0 && (
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
              className="bg-brand-accent hover:bg-brand-accent/90 text-[#FFFFFF] px-6 py-3 sm:px-8 sm:py-4 rounded-full font-bold uppercase tracking-wider shadow-lg shadow-brand-accent/25 transition-all text-xs sm:text-sm flex items-center justify-center space-x-2"
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
                className="relative rounded-3xl overflow-hidden min-h-[340px] flex items-center bg-zinc-900 text-[#FFFFFF] group cursor-pointer border border-brand-gold/15 hover:border-brand-gold/35 transition-all duration-500 shadow-xl hover-lift"
              >
                {/* Offer Image - Full Card Bright HD */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="w-full h-full object-cover opacity-100 brightness-105 contrast-105 group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Seamless smooth gradient fade directly integrated with image */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 via-50% to-transparent" />
                </div>

                {/* Offer Content directly on image */}
                <div className="relative z-10 p-8 md:p-12 max-w-md">
                  <span className="text-[9px] font-bold uppercase tracking-widest bg-brand-gold/20 border border-brand-gold/45 text-brand-gold px-3 py-1 rounded-md drop-shadow-md">
                    {offer.badge}
                  </span>
                  <h3 className="font-display text-2xl md:text-3xl font-semibold mt-5 text-[#FFFFFF] tracking-wide drop-shadow-lg">
                    {offer.title}
                  </h3>
                  {(() => {
                    let descText = offer.description || '';
                    let dishes: string[] = [];
                    try {
                      if (descText && descText.trim().startsWith('{')) {
                        const parsed = JSON.parse(descText);
                        descText = parsed.text || '';
                        if (Array.isArray(parsed.comboDishes)) {
                          dishes = parsed.comboDishes;
                        }
                      }
                    } catch (e) {
                      // ignore parse error
                    }

                    return (
                      <>
                        {descText && (
                          <p className="text-xs text-[#FFFFFF]/80 mt-3 font-sans leading-relaxed drop-shadow-md">
                            {descText}
                          </p>
                        )}
                      </>
                    );
                  })()}

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
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).onerror = null;
                      (e.currentTarget as HTMLImageElement).src = '/dhaba_restaurant.png';
                    }}
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

                {/* Enterprise Founder Trigger Badge */}
                <motion.div
                  className="absolute bottom-4 right-4 z-20 cursor-pointer"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.button
                    onClick={() => setShowFounderModal(true)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-900 text-white pl-2 pr-4 py-2 rounded-full shadow-lg border border-slate-700/80 backdrop-blur-md transition-all duration-200 select-none cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-500 shrink-0 bg-slate-900 relative">
                      <img
                        src="/founder-praveen-solanki.jpg"
                        alt="Praveen Kumar Solanki"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold text-white tracking-tight leading-none">Praveen Kumar Solanki</span>
                      <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">Meet the Founder</span>
                    </div>
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

              {/* Elegant highlights grid with professional vector icons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8">
                {[
                  { icon: <CheckCircle2 size={18} className="text-[#1E4D2B] shrink-0" />, label: '100% Pure Vegetarian' },
                  { icon: <Leaf size={18} className="text-[#1E4D2B] shrink-0" />, label: 'Fresh Ingredients' },
                  { icon: <Users size={18} className="text-[#1E4D2B] shrink-0" />, label: 'Family Friendly' },
                  { icon: <Car size={18} className="text-[#1E4D2B] shrink-0" />, label: 'Spacious Parking' },
                  { icon: <Sparkles size={18} className="text-[#1E4D2B] shrink-0" />, label: 'Premium Dining Experience' },
                  { icon: <Star size={18} className="text-[#1E4D2B] shrink-0 fill-[#1E4D2B]" />, label: 'Highly Rated' }
                ].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
                    className="flex items-center space-x-3 bg-white p-3.5 rounded-xl border border-brand-dark/10 shadow-sm hover:border-[#1E4D2B]/30 hover:shadow-md transition-all duration-200 select-none"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#1E4D2B]/10 flex items-center justify-center shrink-0">
                      {h.icon}
                    </div>
                    <span className="text-xs font-bold text-brand-dark/85 font-sans tracking-wide">{h.label}</span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-10 flex justify-center md:justify-start">
                <Link
                  href="/about"
                  className="group inline-flex items-center gap-2 sm:gap-2.5 px-5 py-3 sm:px-7 sm:py-3.5 rounded-full bg-[#1E4D2B] hover:bg-[#163820] active:scale-95 text-white font-sans font-bold text-[11px] sm:text-xs uppercase tracking-wider shadow-lg shadow-[#1E4D2B]/20 hover:shadow-xl hover:scale-105 transition-all duration-200 border border-[#1E4D2B]/30 select-none cursor-pointer"
                >
                  <BookOpen size={16} className="text-brand-gold shrink-0 group-hover:scale-110 transition-transform" />
                  <span>Our Story</span>
                  <ArrowRight size={15} className="shrink-0 transform group-hover:translate-x-1 transition-transform" />
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
                className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md select-none font-sans"
                onClick={() => setShowFounderModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 250 }}
                  className="bg-white max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close icon button */}
                  <button
                    onClick={() => setShowFounderModal(false)}
                    className="absolute top-4 right-4 z-20 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                    aria-label="Close modal"
                  >
                    <X size={16} />
                  </button>

                  {/* Executive Header & Large Founder Portrait Card */}
                  <div className="bg-slate-900 text-white p-6 sm:p-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                      {/* Large Executive Portrait Card */}
                      <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl border-4 border-slate-700/80 shadow-2xl overflow-hidden bg-slate-950 shrink-0 relative">
                        <img
                          src="/founder-praveen-solanki.jpg"
                          alt="Praveen Kumar Solanki"
                          className="w-full h-full object-cover object-center"
                        />
                        <span className="absolute bottom-2 right-2 p-1 bg-emerald-500 text-white rounded-full shadow-md" title="Verified Founder">
                          <CheckCircle2 size={14} />
                        </span>
                      </div>

                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-emerald-400 border border-slate-700">
                          <CheckCircle2 size={12} /> Verified Founder
                        </span>
                        <h3 className="font-bold text-xl text-white tracking-tight leading-snug">Praveen Kumar Solanki</h3>
                        <p className="text-xs text-slate-300 font-medium">Founder &amp; Managing Director</p>
                        <p className="text-[11px] text-slate-400 pt-1">Balaji Chilkur Family Dhaba</p>
                      </div>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 md:p-8 space-y-6">
                    {/* Pull Quote */}
                    <div className="bg-slate-50 border-l-4 border-slate-900 p-4 rounded-r-xl">
                      <p className="text-xs md:text-sm font-medium text-slate-800 italic leading-relaxed">
                        "A passionate dream born in 2018, realized as a sanctuary of pure vegetarian dining heritage in 2021."
                      </p>
                    </div>

                    {/* Story Description */}
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                      Under the leadership of Praveen Kumar Solanki, our journey began in 2018 with a commitment to create welcoming dining spaces where families and friends bond over pure, traditional flavors. Following years of culinary research and dedication, our flagship restaurant was successfully launched in 2021 near Chilkur Balaji Temple.
                    </p>

                    {/* Timeline Milestones */}
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Key Milestones</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 space-y-1">
                          <span className="text-xs font-bold text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded-md inline-block">2018</span>
                          <h4 className="text-xs font-bold text-slate-900 pt-1">The Vision Begins</h4>
                          <p className="text-[11px] text-slate-500 leading-snug">Inspired to build an authentic pure-veg family dining experience.</p>
                        </div>

                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 space-y-1">
                          <span className="text-xs font-bold text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded-md inline-block">2021</span>
                          <h4 className="text-xs font-bold text-slate-900 pt-1">Flagship Launch</h4>
                          <p className="text-[11px] text-slate-500 leading-snug">Established the flagship Balaji Chilkur Family Dhaba.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="px-6 pb-6 pt-2 flex justify-end bg-slate-50/50 border-t border-slate-100">
                    <button
                      onClick={() => setShowFounderModal(false)}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
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
          <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center md:items-end mb-16 text-center md:text-left">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Visual feast</span>
              <h2 className="font-display text-3xl md:text-5xl font-black text-brand-dark mt-3">
                Capturing Culinary Art
              </h2>
            </div>
            <div className="mt-6 md:mt-0 flex justify-center md:justify-end w-full md:w-auto">
              <Link
                href="/gallery"
                className="group inline-flex items-center gap-2 sm:gap-2.5 px-5 py-3 sm:px-7 sm:py-3.5 rounded-full bg-[#1E4D2B] hover:bg-[#163820] active:scale-95 text-white font-sans font-bold text-[11px] sm:text-xs uppercase tracking-wider shadow-lg shadow-[#1E4D2B]/20 hover:shadow-xl hover:scale-105 transition-all duration-200 border border-[#1E4D2B]/30 select-none cursor-pointer"
              >
                <Images size={16} className="text-brand-gold shrink-0 group-hover:rotate-6 transition-transform" />
                <span>View Full Gallery</span>
                <ArrowRight size={15} className="shrink-0 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
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
                      src={formatImageUrl(photo.src) || getFallbackFoodImage(photo.title, photo.menuCategory)}
                      alt={photo.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).onerror = null;
                        (e.currentTarget as HTMLImageElement).src = getFallbackFoodImage(photo.title, photo.menuCategory);
                      }}
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
        <section id="reviews" className="py-24 bg-[#ECE3D4]/50 border-t border-brand-dark/5 overflow-hidden scroll-mt-24">
          <div className="max-w-7xl mx-auto px-6 md:px-12 mb-16">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Verified Feedback</span>
              <h2 className="font-display text-3xl md:text-5xl font-black text-brand-dark mt-3">
                Words From Our Patrons
              </h2>

              {/* Google Rating Summary Badge */}
              <div className="inline-flex items-center gap-2.5 bg-white px-4 py-2 rounded-full border border-brand-dark/10 shadow-sm mt-4">
                <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs text-brand-dark">4.0</span>
                  <div className="flex text-amber-500">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <Star size={12} className="text-zinc-300" />
                  </div>
                </div>
                <span className="text-[11px] text-zinc-500 font-medium">(70+ Google Reviews)</span>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setIsWriteReviewOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-accent hover:bg-brand-accent/90 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                  <MessageSquare size={16} />
                  <span>Write a Review</span>
                </button>
              </div>
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

          {/* Submit Customer Review Modal */}
          <AnimatePresence>
            {isWriteReviewOpen && (
              <SubmitReviewModal
                onClose={() => setIsWriteReviewOpen(false)}
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

      {/* --- Included Dishes Modal --- */}
      <AnimatePresence>
        {viewOfferDishesModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm overflow-hidden touch-none"
            onClick={() => setViewOfferDishesModal(null)}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white border border-zinc-200 text-zinc-900 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl font-sans overflow-hidden pointer-events-auto select-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Pinned Header Section */}
              <div className="shrink-0 p-6 pb-4 border-b border-zinc-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-500">Campaign Details</span>
                      {viewOfferDishesModal.price && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-sm">
                          {viewOfferDishesModal.price}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 tracking-tight mt-1">{viewOfferDishesModal.title}</h3>
                  </div>
                  <button 
                    onClick={() => setViewOfferDishesModal(null)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs font-medium text-zinc-600">
                  <span>Included Items</span>
                  <span className="font-semibold text-zinc-800 bg-zinc-100 px-2.5 py-1 rounded-lg border border-zinc-200/80">
                    {viewOfferDishesModal.dishes.length} Items Selected
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search dish in this campaign..."
                    value={offerDishSearch}
                    onChange={(e) => setOfferDishSearch(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 rounded-xl py-2.5 pl-9 pr-8 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all shadow-sm"
                  />
                  {offerDishSearch && (
                    <button
                      type="button"
                      onClick={() => setOfferDishSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800 p-1"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Category Filter Pills */}
                {(() => {
                  const dishCategoryMap = new Map<string, string>();
                  viewOfferDishesModal.dishes.forEach(dName => {
                    const found = dishes.find(d => d.name === dName);
                    if (found && (found.category || found.categoryName)) {
                      dishCategoryMap.set(dName, found.category || found.categoryName);
                    }
                  });

                  const categoriesInModal = Array.from(new Set(Array.from(dishCategoryMap.values()))).filter(Boolean);

                  if (categoriesInModal.length === 0) return null;

                  return (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                      <button
                        type="button"
                        onClick={() => setModalSelectedCategory('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                          modalSelectedCategory === 'ALL'
                            ? 'bg-zinc-900 text-white shadow-sm'
                            : 'bg-zinc-100 border border-zinc-200/80 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                        }`}
                      >
                        All ({viewOfferDishesModal.dishes.length})
                      </button>
                      {categoriesInModal.map((cat) => {
                        const countInCat = viewOfferDishesModal.dishes.filter(d => dishCategoryMap.get(d) === cat).length;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setModalSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                              modalSelectedCategory === cat
                                ? 'bg-zinc-900 text-white shadow-sm'
                                : 'bg-zinc-100 border border-zinc-200/80 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                            }`}
                          >
                            {cat} ({countInCat})
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Scrollable Dish List */}
              <div 
                className="flex-1 overflow-y-auto p-6 pt-4 space-y-2 overscroll-contain touch-pan-y min-h-0 custom-scrollbar"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                {(() => {
                  const dishCategoryMap = new Map<string, string>();
                  viewOfferDishesModal.dishes.forEach(dName => {
                    const found = dishes.find(d => d.name === dName);
                    if (found && (found.category || found.categoryName)) {
                      dishCategoryMap.set(dName, found.category || found.categoryName);
                    }
                  });

                  const filteredDishes = viewOfferDishesModal.dishes.filter(dName => {
                    const matchesSearch = dName.toLowerCase().includes(offerDishSearch.toLowerCase().trim());
                    const cat = dishCategoryMap.get(dName);
                    const matchesCategory = modalSelectedCategory === 'ALL' || cat === modalSelectedCategory;
                    return matchesSearch && matchesCategory;
                  });

                  if (filteredDishes.length === 0) {
                    return (
                      <div className="py-8 text-center bg-zinc-50 rounded-xl border border-zinc-200/80">
                        <p className="text-xs text-zinc-500 font-medium">No matching dishes found</p>
                      </div>
                    );
                  }

                  return filteredDishes.map((dishName, i) => {
                    const cat = dishCategoryMap.get(dishName);
                    const targetUrl = cat 
                      ? `/menu?category=${encodeURIComponent(cat)}&dish=${encodeURIComponent(dishName)}` 
                      : `/menu?search=${encodeURIComponent(dishName)}`;

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setViewOfferDishesModal(null);
                          navigate.push(targetUrl);
                        }}
                        className="w-full flex items-center justify-between gap-3 bg-zinc-50/80 hover:bg-white border border-zinc-200/80 hover:border-zinc-400 px-4 py-3 rounded-xl text-xs text-zinc-900 font-medium transition-all group/row text-left shadow-2xs cursor-pointer"
                      >
                        <span className="font-semibold text-zinc-900 group-hover/row:text-zinc-950 transition-colors">
                          {dishName}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {viewOfferDishesModal.price && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                              {viewOfferDishesModal.price}
                            </span>
                          )}
                          {cat && (
                            <span className="text-[10px] font-medium text-zinc-500 bg-zinc-200/60 px-2 py-0.5 rounded-md">
                              {cat}
                            </span>
                          )}
                          <ArrowRight size={13} className="text-zinc-400 group-hover/row:text-zinc-800 group-hover/row:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>

              {/* Pinned Footer */}
              <div className="shrink-0 p-4 px-6 border-t border-zinc-100 bg-zinc-50/50 flex justify-end">
                <button
                  onClick={() => setViewOfferDishesModal(null)}
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs rounded-xl transition-all shadow-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
