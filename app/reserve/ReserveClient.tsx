"use client";
import React from 'react';
import { ReservationForm } from '../../src/components/ReservationForm';
import { motion } from 'framer-motion';

export default function ReserveClient() {
  return (
    <div className="pt-28 pb-20 px-4 md:px-8 min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full z-10"
      >
        <ReservationForm />
      </motion.div>
    </div>
  );
}
