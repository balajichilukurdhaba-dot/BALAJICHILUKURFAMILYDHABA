import React from 'react';
import { motion } from 'framer-motion';
import { Star, Flame, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface Dish {
  id: string;
  name: string;
  teluguName?: string;
  description: string;
  price: string | number;
  category: string;
  image: string;
  rating?: number;
  isPopular?: boolean;
  isVegetarian?: boolean;
  isBestseller?: boolean;
  isChefSpecial?: boolean;
  isSeasonal?: boolean;
  isOutOfStock?: boolean;
  images?: string[];
  scheduleDays?: string[];
  scheduleTimings?: string;
  isRecommended?: boolean;
}

interface DishCardProps {
  dish: Dish;
  onOrderClick?: (dish: Dish) => void;
  isCompact?: boolean;
}

export function formatImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return '';
  }
  const cleanUrl = url.trim();
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:')) {
    return cleanUrl;
  }
  if (cleanUrl.startsWith('/')) {
    return cleanUrl;
  }
  return `/${cleanUrl}`;
}

export function getFallbackFoodImage(dishName: string = '', categoryName: string = ''): string {
  const name = (dishName + ' ' + categoryName).toLowerCase();
  if (name.includes('biryani') || name.includes('rice') || name.includes('pulao')) {
    return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80';
  }
  if (name.includes('paneer') || name.includes('tikka') || name.includes('starter') || name.includes('kebab')) {
    return 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80';
  }
  if (name.includes('roti') || name.includes('naan') || name.includes('paratha') || name.includes('bread')) {
    return 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80';
  }
  if (name.includes('curry') || name.includes('masala') || name.includes('gravy') || name.includes('dal')) {
    return 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80';
  }
  if (name.includes('dessert') || name.includes('sweet') || name.includes('ice cream') || name.includes('gulab')) {
    return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
}

export const DishCard: React.FC<DishCardProps> = ({ dish, onOrderClick, isCompact }) => {
  const navigate = useRouter();

  const handleOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOrderClick) {
      onOrderClick(dish);
    } else {
      // Navigate to Menu page with category and dish pre-selected
      navigate.push(`/menu?category=${encodeURIComponent(dish.category)}&dish=${encodeURIComponent(dish.name)}`);
    }
  };

  return (
    <motion.div
      onClick={dish.isOutOfStock ? undefined : handleOrder}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      whileHover={dish.isOutOfStock ? {} : { y: -8 }}
      className={`group relative bg-[#F5FFFA] rounded-2xl overflow-hidden border border-brand-dark/10 shadow-sm transition-shadow flex flex-col h-full ${
        dish.isOutOfStock ? 'opacity-60 grayscale cursor-not-allowed' : 'cursor-pointer hover:shadow-xl'
      }`}
    >
      {/* Popular / Veg badges */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {dish.isPopular && !dish.isOutOfStock && (
          <span className="flex items-center space-x-1 bg-brand-accent text-[#FFFFFF] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
            <Flame size={10} className="fill-current" />
            <span>Popular</span>
          </span>
        )}
        {dish.isVegetarian !== undefined && (
          <span className={`w-5 h-5 flex items-center justify-center rounded-md border-2 bg-white ${dish.isVegetarian ? 'border-green-600' : 'border-red-600'}`}>
            <span className={`w-2 h-2 rounded-full ${dish.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`} />
          </span>
        )}
      </div>

      {/* Image container with luxury reveal */}
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-dark/5">
        <img 
          src={formatImageUrl(dish.image) || getFallbackFoodImage(dish.name, dish.category)} 
          alt={dish.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).onerror = null;
            (e.currentTarget as HTMLImageElement).src = getFallbackFoodImage(dish.name, dish.category);
          }}
        />
        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        
        {/* Sold out overlay */}
        {dish.isOutOfStock && (
          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
            <span className="bg-zinc-800 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`${isCompact ? 'p-4 lg:p-6 xl:p-5' : 'p-6'} flex flex-col flex-grow`}>
        {/* Rating and Category */}
        <div className="flex justify-between items-center mb-1.5">
          <span className={`uppercase font-semibold tracking-wider text-brand-olive font-sans ${isCompact ? 'text-[10px] lg:text-xs xl:text-[10px]' : 'text-xs'}`}>
            {dish.category}
          </span>
          {dish.rating && (
            <div className="flex items-center space-x-1 text-brand-gold">
              <Star size={11} className="fill-current" />
              <span className={`font-semibold text-brand-dark ${isCompact ? 'text-[10px] lg:text-xs xl:text-[10px]' : 'text-xs'}`}>{dish.rating}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="mb-1.5">
          <h3 className={`font-display font-extrabold text-brand-dark group-hover:text-brand-accent transition-colors duration-300 ${isCompact ? 'text-base lg:text-xl xl:text-lg' : 'text-xl'}`}>
            {dish.name}
          </h3>
          {dish.teluguName && (
            <p className={`font-telugu text-brand-accent/80 font-medium ${isCompact ? 'text-xs lg:text-sm xl:text-xs' : 'text-sm'}`}>
              {dish.teluguName}
            </p>
          )}
        </div>

        {/* Description */}
        <p className={`font-sans text-brand-dark/70 leading-relaxed flex-grow ${isCompact ? 'text-xs lg:text-sm xl:text-xs mb-4 lg:mb-6 xl:mb-4' : 'text-sm mb-6'}`}>
          {dish.description}
        </p>

        {/* Price & Action */}
        <div className="pt-3 border-t border-brand-dark/5 mt-auto space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-display text-base sm:text-lg font-black text-brand-dark">
              {dish.price}
            </span>
          </div>

          {dish.isOutOfStock ? (
            <button 
              disabled
              className="w-full py-2.5 bg-slate-100 text-slate-400 font-semibold text-xs rounded-xl border border-slate-200 cursor-not-allowed select-none text-center"
            >
              Sold Out
            </button>
          ) : (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOrder}
              className="w-full py-2.5 bg-[#12301A] hover:bg-[#1b4325] text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md border border-emerald-800/40 transition-all flex items-center justify-center gap-2 select-none group"
            >
              <ShoppingBag size={14} className="text-[#E0B252] group-hover:scale-110 transition-transform" />
              <span>Order Now</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
