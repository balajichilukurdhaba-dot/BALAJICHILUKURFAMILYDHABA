"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  content: string;
  rating: number;
  source?: string;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="glass-panel p-8 md:p-10 rounded-2xl relative overflow-hidden flex flex-col justify-between h-full border border-brand-dark/10 shadow-sm hover-lift"
    >
      {/* Quotation icon background decorator */}
      <div className="absolute -top-4 -right-4 text-brand-accent/5 pointer-events-none select-none">
        <Quote size={120} />
      </div>

      <div className="relative z-10 flex flex-col space-y-6">
        {/* Rating stars */}
        <div className="flex space-x-1 text-brand-gold">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star key={i} size={16} className="fill-current" />
          ))}
        </div>

        {/* Testimonial Quote */}
        <p className="font-display italic text-brand-dark text-lg md:text-xl leading-relaxed">
          "{testimonial.content}"
        </p>
      </div>

      {/* Citation info */}
      <div className="mt-8 pt-6 border-t border-brand-dark/15 flex justify-between items-center relative z-10">
        <div>
          <h4 className="font-sans font-bold text-brand-dark text-base uppercase tracking-wider">
            {testimonial.name}
          </h4>
          {testimonial.role && (
            <p className="text-xs text-brand-olive font-semibold mt-0.5 uppercase tracking-widest">
              {testimonial.role}
            </p>
          )}
        </div>
        {testimonial.source && (
          <span className="text-[10px] font-bold uppercase tracking-widest bg-brand-dark/5 text-brand-dark/60 px-3 py-1 rounded-full border border-brand-dark/5">
            {testimonial.source}
          </span>
        )}
      </div>
    </motion.div>
  );
};
