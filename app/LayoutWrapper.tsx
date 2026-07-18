"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '../src/components/Navbar';
import { Footer } from '../src/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <>
      {!isAdmin && <Navbar />}
      <main className="flex-grow">
        {isAdmin ? (
          children
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex-grow flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
      {!isAdmin && <Footer />}
    </>
  );
}

