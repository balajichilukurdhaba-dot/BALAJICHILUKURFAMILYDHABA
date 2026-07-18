"use client";
import React, { useState, useEffect } from 'react';
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
  User,
  Home,
  UtensilsCrossed,
  Image,
  Tag,
  MessageSquare,
  Inbox,
  Users,
  ShieldAlert,
  Database,
  Award,
  Bell
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
  const [adminEmail, setAdminEmail] = useState<string>('');
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

  // Fetch the current admin's email for the snapshot modal
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setAdminEmail(user.email);
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
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Reservations', path: '/admin/reservations', icon: Calendar, badgeKey: 'reservations' },
    { name: 'WhatsApp Orders', path: '/admin/orders', icon: MessageCircle, badgeKey: 'whatsapp_orders' },
    { name: 'Checkout Rewards', path: '/admin/checkout', icon: Award },
    { name: 'QR Scanner', path: '/admin/scanner', icon: QrCode },
    { name: 'Homepage CMS', path: '/admin/homepage', icon: Home },
    { name: 'Menu Editor CMS', path: '/admin/menu', icon: UtensilsCrossed },
    { name: 'Gallery CMS', path: '/admin/gallery', icon: Image },
    { name: 'Offers CMS', path: '/admin/offers', icon: Tag },
    { name: 'Reviews CMS', path: '/admin/testimonials', icon: MessageSquare, badgeKey: 'testimonials' },
    { name: 'Customer Inbox', path: '/admin/messages', icon: Inbox, badgeKey: 'queries' },
    { name: 'Audit Trail', path: '/admin/audit', icon: ShieldAlert },
    { name: 'Backups & Seed', path: '/admin/backup', icon: Database },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const totalNotifications = Object.values(counts).reduce((a, b) => a + b, 0);

  // Do not render sidebar on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <>
    <AntdProvider>
      <div className="flex h-screen bg-[#FFFFFF] overflow-hidden font-sans selection:bg-[#1E4D2B] selection:text-[#FFFFFF]">
        {/* Desktop Sidebar (Deep Chocolate-Charcoal #1E4D2B) */}
        <aside className="w-72 bg-[#1E4D2B] text-zinc-150 flex flex-col border-r border-brand-dark/10 shadow-md z-30 hidden lg:flex font-sans">
          {/* Header Branding */}
          <div className="p-6 border-b border-white/10 flex items-center gap-4">
            <div className="relative p-1 bg-[#1E4D2B]/15 rounded-full border border-[#1E4D2B]/25 shadow-md">
              <img src="/bsd-logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <span className="font-display font-black uppercase tracking-wider text-sm leading-tight text-[#FAF6EE] drop-shadow-sm">
                Balaji Chilkur
              </span>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#1E4D2B]/80 mt-0.5">
                Admin Portal
              </p>
            </div>
          </div>


          
          {/* Navigation */}
          <nav className="flex-1 py-5 px-4 flex flex-col gap-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              
              // Get current count from API
              const baseCount = item.badgeKey ? (counts[item.badgeKey as keyof typeof counts] || 0) : 0;
              
              // Testimonials seen offset
              let badgeCount = baseCount;
              if (item.badgeKey === 'testimonials') {
                const seenCount = typeof window !== 'undefined' ? Number(localStorage.getItem('last_seen_testimonials_count') || 0) : 0;
                badgeCount = Math.max(0, baseCount - seenCount);
              }

              // If currently viewing this page, hide the badge (seen)
              if (isActive) {
                badgeCount = 0;
              }

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-250 font-sans text-[11px] font-bold uppercase tracking-wider border relative group ${
                    isActive 
                      ? 'text-white border-white/20 z-10' 
                      : 'text-[#FAF6EE]/75 border-transparent hover:bg-[#FAF6EE]/10 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeAdminNav"
                      className="absolute inset-0 bg-[#FAF6EE]/15 rounded-xl border border-white/20 -z-10 shadow-inner"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon size={14} className={isActive ? 'text-white' : 'text-[#FAF6EE]/50 group-hover:text-white transition-colors'} />
                  <span>{item.name}</span>
                  {badgeCount > 0 && (
                    <span className="ml-auto bg-[#1E4D2B] text-white text-[9px] font-black px-2 py-0.5 rounded-full min-w-[18px] text-center shadow-md animate-pulse border border-white/10">
                      {badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* User Session Footer */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg bg-black/25 text-[#FAF6EE]/70 border border-white/10 hover:bg-[#1E4D2B] hover:text-white transition-all duration-200 font-bold uppercase tracking-wider text-[10px]"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Container */}
        <div className="flex-grow flex flex-col overflow-hidden relative">
          {/* Mobile Header Bar */}
          <header className="lg:hidden w-full bg-[#1E4D2B] text-zinc-150 px-6 py-4 flex justify-between items-center border-b border-white/10 z-30">
            <div className="flex items-center gap-3">
              <img src="/bsd-logo.png" alt="Logo" className="w-8 h-8 object-contain p-0.5 bg-[#1E4D2B]/10 rounded-full border border-[#1E4D2B]/25" />
              <span className="font-display font-black uppercase text-xs tracking-wider text-[#FAF6EE]">
                BSD Admin
              </span>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-300 hover:bg-[#1E4D2B]/15 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <MenuIcon size={20} />}
            </button>
          </header>

          {/* Content Area */}
          <main className="flex-grow overflow-y-auto p-6 md:p-10 pb-28 lg:pb-10 relative">
            <div className="absolute inset-0 noise-overlay opacity-[0.01] pointer-events-none" />
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 max-w-7xl mx-auto w-full flex-grow"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Mobile Drawer (Fallback Navigation) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 bg-[#1E4D2B]/95 z-40 backdrop-blur-md flex flex-col pt-24 px-6 pb-6">

              <nav className="flex-grow flex flex-col gap-2 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  const Icon = item.icon;
                  
                  const baseCount = item.badgeKey ? (counts[item.badgeKey as keyof typeof counts] || 0) : 0;
                  
                  let badgeCount = baseCount;
                  if (item.badgeKey === 'testimonials') {
                    const seenCount = typeof window !== 'undefined' ? Number(localStorage.getItem('last_seen_testimonials_count') || 0) : 0;
                    badgeCount = Math.max(0, baseCount - seenCount);
                  }

                  if (isActive) {
                    badgeCount = 0;
                  }

                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-5 py-3.5 rounded-xl transition-all font-bold uppercase tracking-wider text-xs border relative ${
                        isActive 
                          ? 'text-white border-white/20 z-10' 
                          : 'text-[#FAF6EE]/75 border-transparent hover:bg-[#FAF6EE]/10 hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeAdminNavMobile"
                          className="absolute inset-0 bg-[#FAF6EE]/15 rounded-xl border border-white/20 -z-10 shadow-inner"
                        />
                      )}
                      <div className="flex items-center gap-4">
                        <Icon size={16} />
                        <span>{item.name}</span>
                      </div>
                      {badgeCount > 0 && (
                        <span className="bg-[#1E4D2B] text-white text-[10px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-md animate-pulse">
                          {badgeCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-auto border-t border-white/10 pt-6">
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl bg-black/25 text-zinc-300 border border-white/10 font-bold uppercase tracking-widest text-xs hover:bg-[#1E4D2B]"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AntdProvider>
    {/* Admin daily login verification modal */}
    {adminEmail && <AdminLoginSnapshotModal adminEmail={adminEmail} />}
    </>
  );
}
