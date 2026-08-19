"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '../src/components/Navbar';
import { Footer } from '../src/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import DiscountPopup from '../src/components/DiscountPopup';
import SmoothScrollProvider from '../src/components/SmoothScrollProvider';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <SmoothScrollProvider>
      {!isAdmin && <DiscountPopup />}
      {!isAdmin && <Navbar />}
      <main className="flex-grow">
        {isAdmin ? (
          children
        ) : (
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full flex-grow flex flex-col"
          >
            {children}
          </motion.div>
        )}
      </main>
      {!isAdmin && <Footer />}
    </SmoothScrollProvider>
  );
}

