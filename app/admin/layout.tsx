"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  QrCode, 
  MessageCircle, 
  Settings, 
  LogOut, 
  Menu,
  Menu as MenuIcon, 
  X,
  Home,
  UtensilsCrossed,
  Image as ImageIcon,
  Tag,
  MessageSquare,
  Inbox,
  ShieldCheck,
  Database,
  Award,
  Bell,
  CheckCircle2,
  ChevronRight,
  UserCheck,
  ExternalLink
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import AntdProvider from '@/components/AntdProvider';
import AdminLoginSnapshotModal from '@/components/AdminLoginSnapshotModal';

class AdminErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Admin Portal Render Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-12 bg-white border border-rose-200 rounded-2xl shadow-sm text-center space-y-4 font-sans">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Dashboard Render Warning</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {this.state.error?.message || 'A temporary render glitch occurred while loading this section.'}
            </p>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            Reload Section
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const notifRef = useRef<HTMLDivElement>(null);

  const [counts, setCounts] = useState<{
    whatsapp_orders: number;
    reservations: number;
    testimonials: number;
    queries: number;
  }>({
    whatsapp_orders: 0,
    reservations: 0,
    testimonials: 0,
    queries: 0
  });

  const totalUnread = (counts.whatsapp_orders || 0) + (counts.reservations || 0) + (counts.testimonials || 0) + (counts.queries || 0);

  const fetchNotificationCounts = async () => {
    try {
      const params = new URLSearchParams();
      const lastSeenOrders = typeof window !== 'undefined' ? localStorage.getItem('lastSeen_orders') : null;
      const lastSeenReservations = typeof window !== 'undefined' ? localStorage.getItem('lastSeen_reservations') : null;
      const lastSeenQueries = typeof window !== 'undefined' ? localStorage.getItem('lastSeen_queries') : null;
      const lastSeenTestimonials = typeof window !== 'undefined' ? localStorage.getItem('lastSeen_testimonials') : null;

      if (lastSeenOrders) params.set('lastSeen_orders', lastSeenOrders);
      if (lastSeenReservations) params.set('lastSeen_reservations', lastSeenReservations);
      if (lastSeenQueries) params.set('lastSeen_queries', lastSeenQueries);
      if (lastSeenTestimonials) params.set('lastSeen_testimonials', lastSeenTestimonials);

      const res = await fetch(`/api/admin/notifications?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.counts) {
        setCounts(data.counts);
      }
    } catch (e) {
      // Silently handle transient network fetch errors during dev server rebuilds
    }
  };

  useEffect(() => {
    fetchNotificationCounts();
    const interval = setInterval(fetchNotificationCounts, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Automatically mark section as seen when admin visits the page
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const now = new Date().toISOString();

    if (pathname.startsWith('/admin/reservations')) {
      localStorage.setItem('lastSeen_reservations', now);
      setCounts(prev => ({ ...prev, reservations: 0 }));
    } else if (pathname.startsWith('/admin/orders')) {
      localStorage.setItem('lastSeen_orders', now);
      setCounts(prev => ({ ...prev, whatsapp_orders: 0 }));
    } else if (pathname.startsWith('/admin/testimonials')) {
      localStorage.setItem('lastSeen_testimonials', now);
      setCounts(prev => ({ ...prev, testimonials: 0 }));
    } else if (pathname.startsWith('/admin/messages')) {
      localStorage.setItem('lastSeen_queries', now);
      setCounts(prev => ({ ...prev, queries: 0 }));
    }
  }, [pathname]);

  // Close notification popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Immediate synchronous local session check (0ms latency, zero page flash)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    if (pathname === '/admin/login') return true;
    const hasCookie = document.cookie.split('; ').some(row => row.startsWith('admin_logged_in=true'));
    const hasLocalStorage = localStorage.getItem('admin_logged_in') === 'true';
    return hasCookie || hasLocalStorage;
  });

  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (pathname === '/admin/login') return false;
    const hasCookie = document.cookie.split('; ').some(row => row.startsWith('admin_logged_in=true'));
    const hasLocalStorage = localStorage.getItem('admin_logged_in') === 'true';
    return !(hasCookie || hasLocalStorage);
  });

  const MAX_SESSION_MS = 6 * 60 * 60 * 1000; // 6 hours

  const performLogout = async (reason?: string) => {
    if (typeof window !== 'undefined') {
      document.cookie = "admin_logged_in=; path=/; max-age=0";
      document.cookie = "admin_login_time=; path=/; max-age=0";
      localStorage.removeItem('admin_logged_in');
      localStorage.removeItem('admin_email');
      localStorage.removeItem('admin_login_time');
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore
    }
    window.location.href = reason ? `/admin/login?reason=${reason}` : '/admin/login';
  };

  const handleLogout = async () => {
    await performLogout();
  };

  // Fetch admin user on initial mount
  useEffect(() => {
    if (pathname === '/admin/login') {
      setIsAuthChecking(false);
      return;
    }

    const checkSession = async () => {
      if (typeof window !== 'undefined') {
        const loginTimeStr = localStorage.getItem('admin_login_time') || 
          document.cookie.split('; ').find(row => row.startsWith('admin_login_time='))?.split('=')[1];
        
        if (loginTimeStr) {
          const loginTime = parseInt(loginTimeStr, 10);
          if (!isNaN(loginTime) && (Date.now() - loginTime > MAX_SESSION_MS)) {
            setIsAuthenticated(false);
            setIsAuthChecking(false);
            performLogout('expired');
            return;
          }
        }
      }

      let isAuthed = false;
      let email = '';

      if (typeof window !== 'undefined') {
        const hasCookie = document.cookie.split('; ').some(row => row.startsWith('admin_logged_in=true'));
        const hasLocalStorage = localStorage.getItem('admin_logged_in') === 'true';
        if (hasCookie || hasLocalStorage) {
          isAuthed = true;
          email = localStorage.getItem('admin_email') || 'admin@balajichilkur.com';
        }
      }

      if (!isAuthed) {
        try {
          const res = await supabase.auth.getUser().catch(() => ({ data: { user: null }, error: null }));
          if (res?.data?.user) {
            isAuthed = true;
            email = res.data.user.email || '';
          }
        } catch (e) {
          // Ignore
        }
      }

      if (!isAuthed) {
        setIsAuthenticated(false);
        setIsAuthChecking(false);
        router.replace('/admin/login');
      } else {
        setIsAuthenticated(true);
        if (email) setAdminEmail(email);
        setIsAuthChecking(false);
      }
    };

    checkSession();

    // Auto-logout timer: check on focus/visibilitychange
    const checkExpirationOnFocus = () => {
      if (typeof window !== 'undefined') {
        const loginTimeStr = localStorage.getItem('admin_login_time') || 
          document.cookie.split('; ').find(row => row.startsWith('admin_login_time='))?.split('=')[1];
        if (loginTimeStr) {
          const loginTime = parseInt(loginTimeStr, 10);
          if (!isNaN(loginTime) && (Date.now() - loginTime > MAX_SESSION_MS)) {
            performLogout('expired');
          }
        }
      }
    };

    const sessionInterval = setInterval(checkExpirationOnFocus, 15_000);
    window.addEventListener('focus', checkExpirationOnFocus);
    window.addEventListener('visibilitychange', checkExpirationOnFocus);

    return () => {
      clearInterval(sessionInterval);
      window.removeEventListener('focus', checkExpirationOnFocus);
      window.removeEventListener('visibilitychange', checkExpirationOnFocus);
    };
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Reservations', path: '/admin/reservations', icon: Calendar, badgeKey: 'reservations' },
    { name: 'WhatsApp Orders', path: '/admin/orders', icon: MessageCircle, badgeKey: 'whatsapp_orders' },
    { name: 'Rewards & Vouchers', path: '/admin/checkout', icon: Award },
    { name: 'QR Scanner', path: '/admin/scanner', icon: QrCode },
    { name: 'Page CMS', path: '/admin/homepage', icon: Home },
    { name: 'Menu Catalog', path: '/admin/menu', icon: UtensilsCrossed },
    { name: 'Media Gallery', path: '/admin/gallery', icon: ImageIcon },
    { name: 'Promotions', path: '/admin/offers', icon: Tag },
    { name: 'Customer Reviews', path: '/admin/testimonials', icon: MessageSquare, badgeKey: 'testimonials' },
    { name: 'Inbox & Queries', path: '/admin/messages', icon: Inbox, badgeKey: 'queries' },
    { name: 'Audit & Access Logs', path: '/admin/audit', icon: ShieldCheck },
    { name: 'System Maintenance', path: '/admin/backup', icon: Database },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const totalNotifications = Object.values(counts).reduce((a, b) => a + b, 0);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-slate-300">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <span className="text-xs font-medium text-slate-400">Verifying session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AntdProvider>
      <div 
        className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans antialiased"
        data-lenis-prevent
      >
        {/* Enterprise Desktop Sidebar */}
        <aside 
          className="w-64 bg-[#0F172A] text-slate-300 flex flex-col border-r border-slate-800 z-30 hidden lg:flex select-none flex-shrink-0 h-full"
          data-lenis-prevent
        >
          {/* Workspace Branding Header */}
          <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center p-1">
                <img src="/bsd-logo.png" alt="BSD" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs tracking-tight text-white leading-none">
                  Balaji Dhaba
                </span>
                <span className="text-[10px] font-medium text-slate-400 mt-1">
                  Management Portal
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav 
            className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto custom-scrollbar overscroll-contain"
            data-lenis-prevent
          >
            {navItems.map((item) => {
              const isActive = item.path === '/admin' 
                ? pathname === '/admin' 
                : (pathname === item.path || pathname?.startsWith(`${item.path}/`));
              const Icon = item.icon;
              
              const baseCount = item.badgeKey ? (counts[item.badgeKey as keyof typeof counts] || 0) : 0;
              let badgeCount = baseCount;
              if (item.badgeKey === 'testimonials') {
                const seenCount = typeof window !== 'undefined' ? Number(localStorage.getItem('last_seen_testimonials_count') || 0) : 0;
                badgeCount = Math.max(0, baseCount - seenCount);
              }
              if (isActive) badgeCount = 0;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  prefetch={true}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 relative group ${
                    isActive 
                      ? 'text-white bg-slate-800/90 font-semibold shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSideNav"
                      className="absolute inset-y-1.5 left-0 w-1 bg-emerald-500 rounded-r-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200 transition-colors'} />
                    <span>{item.name}</span>
                  </div>
                  {badgeCount > 0 && (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Footer */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 flex-shrink-0">
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center text-xs font-semibold uppercase">
                  {adminEmail ? adminEmail[0] : 'A'}
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-[11px] font-medium text-slate-200 truncate">
                    {adminEmail || 'Administrator'}
                  </span>
                  <span className="text-[9px] text-slate-500">System Admin</span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Sticky Header */}
          <header className="h-16 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
              >
                <Menu size={20} />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                <Link href="/" target="_blank" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span>Balaji Chilkur Dhaba</span>
                  <ExternalLink size={12} />
                </Link>
                <span>/</span>
                <span className="text-slate-200 capitalize font-medium">
                  {pathname === '/admin' ? 'Dashboard' : pathname.replace('/admin/', '').replace('-', ' ')}
                </span>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2.5">
              {/* Notification Center */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Notifications"
                >
                  <Bell size={18} />
                  {totalUnread > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#0F172A] animate-pulse" />
                  )}
                </button>

                <AnimatePresence>
                  {notifDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1E293B] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 text-slate-200"
                    >
                      <div className="px-4 py-3 border-b border-slate-700/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white">Notifications</span>
                          {totalUnread > 0 && (
                            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                              {totalUnread} new
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              const now = new Date().toISOString();
                              localStorage.setItem('lastSeen_orders', now);
                              localStorage.setItem('lastSeen_reservations', now);
                              localStorage.setItem('lastSeen_queries', now);
                              localStorage.setItem('lastSeen_testimonials', now);
                              setCounts({ whatsapp_orders: 0, reservations: 0, testimonials: 0, queries: 0 });
                            }
                          }}
                          className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors"
                        >
                          Clear all
                        </button>
                      </div>

                      <div className="divide-y divide-slate-700/50 max-h-80 overflow-y-auto custom-scrollbar">
                        {totalUnread === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            <CheckCircle2 size={24} className="mx-auto text-emerald-500/60 mb-2" />
                            <span>All caught up! No new notifications.</span>
                          </div>
                        ) : (
                          <>
                            {counts.reservations > 0 && (
                              <Link
                                href="/admin/reservations"
                                onClick={() => setNotifDropdownOpen(false)}
                                className="px-4 py-3 flex items-start gap-3 hover:bg-slate-700/40 transition-colors block"
                              >
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0 mt-0.5">
                                  <Calendar size={15} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-white">Table Reservations</span>
                                    <span className="text-[10px] font-medium text-emerald-400">{counts.reservations} pending</span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                    New table reservation requests awaiting confirmation
                                  </p>
                                </div>
                              </Link>
                            )}

                            {counts.whatsapp_orders > 0 && (
                              <Link
                                href="/admin/orders"
                                onClick={() => setNotifDropdownOpen(false)}
                                className="px-4 py-3 flex items-start gap-3 hover:bg-slate-700/40 transition-colors block"
                              >
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0 mt-0.5">
                                  <MessageCircle size={15} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-white">WhatsApp Orders</span>
                                    <span className="text-[10px] font-medium text-emerald-400">{counts.whatsapp_orders} new</span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                    New takeaway / delivery WhatsApp orders received
                                  </p>
                                </div>
                              </Link>
                            )}

                            {counts.testimonials > 0 && (
                              <Link
                                href="/admin/testimonials"
                                onClick={() => setNotifDropdownOpen(false)}
                                className="px-4 py-3 flex items-start gap-3 hover:bg-slate-700/40 transition-colors block"
                              >
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0 mt-0.5">
                                  <MessageSquare size={15} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-white">Customer Reviews</span>
                                    <span className="text-[10px] font-medium text-emerald-400">{counts.testimonials} unapproved</span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                    New testimonials submitted awaiting review
                                  </p>
                                </div>
                              </Link>
                            )}

                            {counts.queries > 0 && (
                              <Link
                                href="/admin/messages"
                                onClick={() => setNotifDropdownOpen(false)}
                                className="px-4 py-3 flex items-start gap-3 hover:bg-slate-700/40 transition-colors block"
                              >
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0 mt-0.5">
                                  <Inbox size={15} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-white">Inbox & Queries</span>
                                    <span className="text-[10px] font-medium text-emerald-400">{counts.queries} unread</span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                    New contact form messages awaiting reply
                                  </p>
                                </div>
                              </Link>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Live View Client Website Button */}
              <Link
                href="/"
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <span>Live Site</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </header>

          {/* Page Body Viewport */}
          <main 
            className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overscroll-contain custom-scrollbar min-h-0"
            data-lenis-prevent
          >
            {children}
          </main>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
              />

              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-72 bg-[#0F172A] text-slate-300 flex flex-col h-full z-10 border-r border-slate-800 flex-shrink-0"
                data-lenis-prevent
              >
                <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <img src="/bsd-logo.png" alt="BSD" className="w-7 h-7 object-contain" />
                    <span className="font-semibold text-xs text-white">Management Portal</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 p-1">
                    <X size={18} />
                  </button>
                </div>

                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overscroll-contain custom-scrollbar" data-lenis-prevent>
                  {navItems.map((item) => {
                    const isActive = item.path === '/admin' 
                      ? pathname === '/admin' 
                      : (pathname === item.path || pathname?.startsWith(`${item.path}/`));
                    const Icon = item.icon;
                    const baseCount = item.badgeKey ? (counts[item.badgeKey as keyof typeof counts] || 0) : 0;
                    const badgeCount = isActive ? 0 : baseCount;

                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                          isActive ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={16} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                          <span>{item.name}</span>
                        </div>
                        {badgeCount > 0 && (
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            {badgeCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-slate-800 bg-slate-900">
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>
      </div>
      <AdminLoginSnapshotModal adminEmail={adminEmail || 'admin@balajichilkur.com'} />
    </AntdProvider>
  );
}
