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
  UserCheck
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import AntdProvider from '@/components/AntdProvider';
import AdminLoginSnapshotModal from '@/components/AdminLoginSnapshotModal';

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

  const fetchNotificationCounts = async () => {
    try {
      const params = new URLSearchParams();
      const lastSeenOrders = localStorage.getItem('lastSeen_orders');
      const lastSeenReservations = localStorage.getItem('lastSeen_reservations');
      const lastSeenQueries = localStorage.getItem('lastSeen_queries');

      if (lastSeenOrders) params.set('lastSeen_orders', lastSeenOrders);
      if (lastSeenReservations) params.set('lastSeen_reservations', lastSeenReservations);
      if (lastSeenQueries) params.set('lastSeen_queries', lastSeenQueries);

      const res = await fetch(`/api/admin/notifications?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.counts) {
        setCounts(data.counts);
      }
    } catch (e) {
      console.error('Failed to load notification counts:', e);
    }
  };

  useEffect(() => {
    fetchNotificationCounts();
    const interval = setInterval(fetchNotificationCounts, 15_000);
    return () => clearInterval(interval);
  }, []);

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

  // Fetch current admin user
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) setAdminEmail(user.email);
      } catch (e) {
        // Auth fallback
      }
    })();
  }, []);

  // Update seen marker timestamps when pathname changes
  useEffect(() => {
    if (pathname === '/admin/orders') {
      localStorage.setItem('lastSeen_orders', new Date().toISOString());
      setCounts(prev => ({ ...prev, whatsapp_orders: 0 }));
    } else if (pathname === '/admin/reservations') {
      localStorage.setItem('lastSeen_reservations', new Date().toISOString());
      setCounts(prev => ({ ...prev, reservations: 0 }));
    } else if (pathname === '/admin/messages') {
      localStorage.setItem('lastSeen_queries', new Date().toISOString());
      setCounts(prev => ({ ...prev, queries: 0 }));
    } else if (pathname === '/admin/testimonials') {
      localStorage.setItem('last_seen_testimonials_count', counts.testimonials.toString());
    }
  }, [pathname, counts.testimonials]);

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      document.cookie = "admin_logged_in=; path=/; max-age=0";
      localStorage.removeItem('admin_logged_in');
      localStorage.removeItem('admin_email');
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore
    }
    window.location.href = '/admin/login';
  };

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

  return (
    <AntdProvider>
      <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans antialiased">
        {/* Enterprise Desktop Sidebar */}
        <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col border-r border-slate-800 z-30 hidden lg:flex select-none">
          {/* Workspace Branding Header */}
          <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between">
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
          <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
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
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors relative group ${
                    isActive 
                      ? 'text-white bg-slate-800/90 font-semibold' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSideNav"
                      className="absolute inset-y-1.5 left-0 w-1 bg-emerald-500 rounded-r-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
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
          <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
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

        {/* Main Content & Top Header Area */}
        <div className="flex-grow flex flex-col overflow-hidden">
          {/* Enterprise Top Header Bar */}
          <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between z-20 shadow-sm">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <MenuIcon size={18} />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span>Management</span>
                <ChevronRight size={14} className="text-slate-400" />
                <span className="text-slate-900 font-semibold capitalize">
                  {pathname.split('/')[2] || 'Dashboard'}
                </span>
              </div>
            </div>

            {/* Notification Center Trigger & Admin Controls */}
            <div className="flex items-center gap-3" ref={notifRef}>
              <div className="relative">
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className={`p-2 rounded-lg border transition-colors relative flex items-center justify-center ${
                    notifDropdownOpen 
                      ? 'bg-slate-100 border-slate-300 text-slate-900' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title="Notification Center"
                >
                  <Bell size={17} />
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border-2 border-white min-w-[16px] text-center">
                      {totalNotifications}
                    </span>
                  )}
                </button>

                {/* Professional Notification Popover */}
                <AnimatePresence>
                  {notifDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-3 z-50 text-slate-800"
                    >
                      <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900">Notification Center</span>
                          {totalNotifications > 0 && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                              {totalNotifications} new
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="py-2 px-2 max-h-72 overflow-y-auto space-y-1">
                        {counts.reservations > 0 && (
                          <Link
                            href="/admin/reservations"
                            onClick={() => setNotifDropdownOpen(false)}
                            className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg text-xs transition-colors border border-transparent hover:border-slate-200"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                                <Calendar size={14} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900">Pending Reservations</span>
                                <span className="text-[10px] text-slate-500">{counts.reservations} new customer requests</span>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-slate-400" />
                          </Link>
                        )}

                        {counts.whatsapp_orders > 0 && (
                          <Link
                            href="/admin/orders"
                            onClick={() => setNotifDropdownOpen(false)}
                            className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg text-xs transition-colors border border-transparent hover:border-slate-200"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
                                <MessageCircle size={14} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900">WhatsApp Orders</span>
                                <span className="text-[10px] text-slate-500">{counts.whatsapp_orders} recent order submissions</span>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-slate-400" />
                          </Link>
                        )}

                        {counts.queries > 0 && (
                          <Link
                            href="/admin/messages"
                            onClick={() => setNotifDropdownOpen(false)}
                            className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg text-xs transition-colors border border-transparent hover:border-slate-200"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
                                <Inbox size={14} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900">Inbox Queries</span>
                                <span className="text-[10px] text-slate-500">{counts.queries} unread contact inquiries</span>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-slate-400" />
                          </Link>
                        )}

                        {totalNotifications === 0 && (
                          <div className="p-6 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                            <CheckCircle2 size={24} className="text-emerald-500" />
                            <span>All notifications cleared. System up to date.</span>
                          </div>
                        )}
                      </div>

                      <div className="px-4 pt-2.5 border-t border-slate-100 text-center">
                        <span className="text-[10px] font-medium text-slate-400">
                          Auto-refreshes live every 15s
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* Page Content Body */}
          <main className="flex-grow overflow-y-auto p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="max-w-7xl mx-auto w-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                className="relative w-72 bg-[#0F172A] text-slate-300 flex flex-col h-full z-10 border-r border-slate-800"
              >
                <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src="/bsd-logo.png" alt="BSD" className="w-7 h-7 object-contain" />
                    <span className="font-semibold text-xs text-white">Management Portal</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 p-1">
                    <X size={18} />
                  </button>
                </div>

                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                  {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    const Icon = item.icon;
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
                          <Icon size={16} />
                          <span>{item.name}</span>
                        </div>
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
    </AntdProvider>
  );
}
