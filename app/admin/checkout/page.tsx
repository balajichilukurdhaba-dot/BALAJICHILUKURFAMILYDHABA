"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Input, InputNumber, Select, Space, Tooltip, Modal, Badge, App
} from 'antd';
import { 
  WhatsAppOutlined, CopyOutlined, DownloadOutlined, CloseCircleOutlined, CheckCircleOutlined, SearchOutlined
} from '@ant-design/icons';
import { 
  DollarSign, Phone, Award, QrCode, Loader2, Sparkles, CheckCircle2, Ticket, FileText, Calendar, Search, RefreshCw, X, ArrowUpRight, Printer, Plus, Trash2, ShoppingCart, SlidersHorizontal, Check
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const { Option } = Select;

// Itemized Bill TypeScript interfaces
interface BillItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isCustom?: boolean;
}

interface MenuItemOption {
  id: string;
  name: string;
  price: number;
  category: string;
}

// Coupon data TypeScript interface
interface Coupon {
  token: string;
  billNo: string;
  phone: string;
  originalBill: number;
  discountPercent: number;
  discountValue: number;
  discountCategory: string;
  expiryEpoch: number;
  isUsed: boolean;
  isCancelled: boolean;
  createdAt: string;
  createdBy?: string;
  usedAt?: string;
  cancelledAt?: string;
}

function CheckoutRewardsContent() {
  const { message, notification } = App.useApp();
  const router = useRouter();

  // Active client-side heartbeat hook
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
      loadVouchersList(); // Refresh ledger in sync
    }, 4000);
    return () => clearInterval(interval);
  }, [router]);

  // Vouchers List Ledger state
  const [vouchers, setVouchers] = useState<Coupon[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form inputs
  const [billNumber, setBillNumber] = useState<string>('');
  const [baseBill, setBaseBill] = useState<number | null>(null);
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [discountCategory, setDiscountCategory] = useState<string>('Business Dining');
  const [discountPercent, setDiscountPercent] = useState<number>(15.00); // 15% default for Business Dining

  // Itemized POS Bill Builder state
  const [orderItems, setOrderItems] = useState<BillItem[]>([]);
  const [menuOptions, setMenuOptions] = useState<MenuItemOption[]>([]);
  const [selectedMenuDishId, setSelectedMenuDishId] = useState<string>('');
  const [itemQty, setItemQty] = useState<number>(1);
  const [customItemName, setCustomItemName] = useState<string>('');
  const [customItemPrice, setCustomItemPrice] = useState<number | null>(null);
  const [paperSize, setPaperSize] = useState<'80mm' | '58mm' | 'A4' | 'A5'>('80mm');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Fetch Menu Items for Dish Selector Dropdown
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch('/api/cms/menu');
        const data = await res.json();
        if (data.categories) {
          const list: MenuItemOption[] = [];
          data.categories.forEach((cat: any) => {
            if (cat.dishes) {
              cat.dishes.forEach((d: any) => {
                list.push({
                  id: d.id,
                  name: d.name,
                  price: Number(d.price || 0),
                  category: cat.name
                });
              });
            }
          });
          setMenuOptions(list);
        }
      } catch (e) {
        console.error('Failed to load menu dishes:', e);
      }
    };
    fetchMenu();
  }, []);

  // Update baseBill from item subtotal
  const updateBaseBillFromItems = (items: BillItem[]) => {
    const sum = items.reduce((total, item) => total + item.totalPrice, 0);
    if (sum > 0) {
      setBaseBill(Math.round(sum * 100) / 100);
    }
  };

  // Add menu dish to bill
  const handleAddMenuDish = () => {
    if (!selectedMenuDishId) return;
    const dish = menuOptions.find(m => m.id === selectedMenuDishId);
    if (!dish) return;

    const qty = itemQty > 0 ? itemQty : 1;
    const newItem: BillItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      name: dish.name,
      quantity: qty,
      unitPrice: dish.price,
      totalPrice: dish.price * qty,
      isCustom: false
    };

    const updated = [...orderItems, newItem];
    setOrderItems(updated);
    updateBaseBillFromItems(updated);

    setSelectedMenuDishId('');
    setItemQty(1);
    message.success(`Added ${dish.name} (x${qty}) to bill`);
  };

  // Add custom manual item & custom price
  const handleAddCustomItem = () => {
    if (!customItemName.trim()) {
      message.error('Please enter item name');
      return;
    }
    if (customItemPrice === null || customItemPrice < 0) {
      message.error('Please enter valid unit price');
      return;
    }

    const qty = itemQty > 0 ? itemQty : 1;
    const newItem: BillItem = {
      id: `custom-${Date.now()}-${Math.random()}`,
      name: customItemName.trim(),
      quantity: qty,
      unitPrice: customItemPrice,
      totalPrice: customItemPrice * qty,
      isCustom: true
    };

    const updated = [...orderItems, newItem];
    setOrderItems(updated);
    updateBaseBillFromItems(updated);

    setCustomItemName('');
    setCustomItemPrice(null);
    setItemQty(1);
    message.success(`Added custom item ${newItem.name}`);
  };

  // Update quantity or unit price for any item in real time
  const handleUpdateItem = (id: string, field: 'quantity' | 'unitPrice', val: number) => {
    const updated = orderItems.map(item => {
      if (item.id === id) {
        const newQty = field === 'quantity' ? Math.max(1, val) : item.quantity;
        const newPrice = field === 'unitPrice' ? Math.max(0, val) : item.unitPrice;
        return {
          ...item,
          quantity: newQty,
          unitPrice: newPrice,
          totalPrice: newQty * newPrice
        };
      }
      return item;
    });
    setOrderItems(updated);
    updateBaseBillFromItems(updated);
  };

  // Remove item from bill
  const handleRemoveItem = (id: string) => {
    const updated = orderItems.filter(item => item.id !== id);
    setOrderItems(updated);
    updateBaseBillFromItems(updated);
  };

  // Generation response states
  const [generating, setGenerating] = useState(false);
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [viewVoucherModal, setViewVoucherModal] = useState<Coupon | null>(null);

  // Auto-calculated Dates
  const generatedDateFormatted = new Date().toISOString().split('T')[0];
  const validityDays = 17;
  const expiryEpoch = Date.now() + validityDays * 24 * 60 * 60 * 1000;
  const expiryDateFormatted = new Date(expiryEpoch).toISOString().split('T')[0];

  // Categories & predefined percentages
  const handleCategoryChange = (val: string) => {
    setDiscountCategory(val);
    if (val === 'Business Dining' || val === 'Corporate Partner Privilege' || val === 'Corporate Discount') {
      setDiscountPercent(15.00);
    } else if (val === 'Happy Hour' || val === 'Happy Hour Special') {
      setDiscountPercent(12.00);
    } else if (val === 'Loyalty Reward' || val === 'VIP Member Loyalty Reward') {
      setDiscountPercent(10.00);
    } else if (val === 'Weekend Delight' || val === 'Weekend Dining Benefit' || val === 'Weekend Offer') {
      setDiscountPercent(20.00);
    } else if (val === 'Festive Benefit' || val === 'Festive Season Offer' || val === 'Festival Offer') {
      setDiscountPercent(10.00);
    } else if (val === 'House Courtesy' || val === 'Manager Courtesy Concession' || val === 'Staff Courtesy') {
      setDiscountPercent(100.00);
    } else if (val === 'Exceptional Approval' || val === 'Custom Manager Adjustment' || val === 'Manual Custom') {
      setDiscountPercent(0.00);
    }
  };

  // Instant absolute calculations
  const calculatedDiscount = baseBill ? Math.round(Number(baseBill) * (discountPercent / 100) * 100) / 100 : 0;
  const finalBill = baseBill ? Math.max(0, Math.round((Number(baseBill) - calculatedDiscount) * 100) / 100) : 0;

  // Load ledger list
  const loadVouchersList = async () => {
    try {
      const res = await fetch('/api/cms/rewards');
      const data = await res.json();
      if (data.success) {
        setVouchers(data.coupons || []);
      }
    } catch (err) {
      console.error('Failed to load vouchers list:', err);
    }
  };

  useEffect(() => {
    setLoadingLedger(true);
    loadVouchersList().finally(() => setLoadingLedger(false));
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseBill || baseBill <= 0) {
      message.error('Valid base bill total is required');
      return;
    }
    if (!billNumber.trim()) {
      message.error('Please enter a Bill / Invoice Number');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 10) {
      message.error('Valid 10-digit customer mobile phone number is required');
      return;
    }

    setGenerating(true);

    const payload = {
      originalBill: baseBill,
      phone: customerPhone.trim(),
      discountValue: calculatedDiscount,
      discountPercent: discountPercent,
      expiryEpoch,
      billNo: billNumber.trim(),
      discountCategory
    };

    try {
      const res = await fetch('/api/cms/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        notification.success({
          title: 'Voucher Created',
          description: `Voucher ${data.token} has been generated for bill ${billNumber}.`,
          placement: 'topRight'
        });

        // Set active coupon for immediate preview card
        const createdCoupon: Coupon = {
          token: data.token,
          billNo: billNumber.trim(),
          phone: customerPhone.trim() || 'Walk-in',
          originalBill: baseBill,
          discountPercent: discountPercent,
          discountValue: data.discountValue,
          discountCategory,
          expiryEpoch: data.expiryEpoch,
          isUsed: false,
          isCancelled: false,
          createdAt: new Date().toISOString()
        };

        setActiveCoupon(createdCoupon);
        loadVouchersList();
        
        // Reset input fields
        setBaseBill(null);
        setBillNumber('');
        setCustomerPhone('');
      } else {
        message.error(data.error || 'Failed to create reward voucher');
      }
    } catch (err) {
      console.error('Failed to generate reward:', err);
      message.error('Network failure generating token');
    } finally {
      setGenerating(false);
    }
  };

  // Compile target verification URL
  const getVerificationUrl = (coupon: Coupon) => {
    const token = coupon.token;
    const billNo = encodeURIComponent(coupon.billNo);
    const rewardAmt = coupon.discountValue;
    const discountPercent = coupon.discountPercent;
    const expiry = new Date(coupon.expiryEpoch).toISOString().split('T')[0];

    return `https://balajichilkur.com/menu?claimBonusToken=${token}&billNo=${billNo}&rewardAmt=${rewardAmt}&discountPercent=${discountPercent}&expiry=${expiry}`;
  };

  // WhatsApp click-to-chat compilation
  const getWhatsAppRedirectionUrl = (coupon: Coupon) => {
    const cleanPhone = coupon.phone.replace(/\D/g, '');
    const prefix = cleanPhone.startsWith('91') || cleanPhone.length > 10 ? '' : '91';
    const targetPhone = `${prefix}${cleanPhone}`;
    const expiryStr = new Date(coupon.expiryEpoch).toISOString().split('T')[0];

    const messageText = `*Balaji Chilkur Family Dhaba* 🌾
Thank you for dining with us! We hope you loved our food and hospitality.

Here is your exclusive Next-Visit Loyalty Reward Voucher details:
🎫 *Voucher Code:* ${coupon.token}
🧾 *Bill Number:* ${coupon.billNo}
💵 *Bill Amount:* ₹${coupon.originalBill}
📈 *Discount Rate:* ${coupon.discountPercent}%
🎁 *Discount Value:* ₹${coupon.discountValue}
📅 *Expiry Date:* ${expiryStr} (17 Days Validity)

*Instructions for Redemption:*
Scan the QR code or click the link below to load your voucher. Present this voucher screen to the counter on checkout.
🔗 Link: ${getVerificationUrl(coupon)}

We look forward to serving you again.`;

    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(messageText)}`;
  };

  // Download QR matrix code as file locally
  const downloadQRCodeFile = (token: string) => {
    const canvas = document.getElementById(`qr-canvas-${token}`) as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `Voucher-QR-${token}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      message.success('QR Code downloaded successfully.');
    } else {
      message.error('QR code element not found.');
    }
  };

  // Copy voucher token clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Voucher code copied to clipboard!');
  };

  // Cancel Voucher
  const cancelVoucher = async (token: string) => {
    try {
      const res = await fetch(`/api/cms/rewards?token=${encodeURIComponent(token)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        message.success('Voucher has been successfully cancelled.');
        loadVouchersList();
        if (activeCoupon?.token === token) {
          setActiveCoupon(prev => prev ? { ...prev, isCancelled: true } : null);
        }
        if (viewVoucherModal?.token === token) {
          setViewVoucherModal(prev => prev ? { ...prev, isCancelled: true } : null);
        }
      } else {
        message.error(data.error || 'Failed to cancel voucher');
      }
    } catch (err) {
      console.error('Failed to cancel voucher:', err);
      message.error('Network failure cancelling voucher');
    }
  };

  // Mark Redeemed Manually
  const redeemVoucherManually = async (token: string) => {
    try {
      const res = await fetch('/api/cms/rewards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (data.success) {
        message.success('Voucher successfully marked as redeemed.');
        loadVouchersList();
        if (activeCoupon?.token === token) {
          setActiveCoupon(prev => prev ? { ...prev, isUsed: true } : null);
        }
        if (viewVoucherModal?.token === token) {
          setViewVoucherModal(prev => prev ? { ...prev, isUsed: true } : null);
        }
      } else {
        message.error(data.error || 'Failed to redeem voucher');
      }
    } catch (err) {
      console.error('Failed to redeem voucher:', err);
      message.error('Network failure redeeming voucher');
    }
  };

  // Filter vouchers by search query
  const filteredVouchers = vouchers.filter(v => {
    if (!v) return false;
    const query = searchQuery.toLowerCase();
    const tokenMatch = v.token ? String(v.token).toLowerCase().includes(query) : false;
    const billNoMatch = v.billNo ? String(v.billNo).toLowerCase().includes(query) : false;
    const phoneMatch = v.phone ? String(v.phone).toLowerCase().includes(query) : false;
    return tokenMatch || billNoMatch || phoneMatch;
  });

  return (
    <div className="space-y-6 font-sans text-slate-800 antialiased max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">Counter Rewards POS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Checkout Rewards &amp; Vouchers</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Issue customer loyalty discount passes and manage redemption status</p>
        </div>
      </div>

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: Issue Discount Voucher */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-base">
              <DollarSign size={18} className="text-[#1E4D2B]" />
              <span>Issue Discount Voucher</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Step 1 of 2</span>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Bill / Invoice Number *
                </label>
                <Input 
                  size="large"
                  required
                  placeholder="e.g. INV-2026-00125" 
                  prefix={<FileText size={15} className="text-slate-400 mr-1" />}
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value.toUpperCase())}
                  className="rounded-xl text-xs font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Base Bill Total (₹) *
                </label>
                <InputNumber
                  size="large"
                  required
                  min={1}
                  placeholder="e.g. 1500" 
                  prefix={<span className="text-slate-400 font-bold text-xs mr-1">₹</span>}
                  value={baseBill}
                  onChange={(val) => setBaseBill(val)}
                  className="w-full rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Customer Mobile Phone *
              </label>
              <Input 
                size="large"
                required
                maxLength={10}
                placeholder="e.g. 9876543210" 
                prefix={<Phone size={15} className="text-slate-400 mr-1" />}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                className="rounded-xl text-xs font-mono"
              />
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Promotion Category
                </label>
                <Select
                  size="large"
                  value={discountCategory}
                  onChange={handleCategoryChange}
                  className="w-full rounded-xl"
                >
                  <Option value="Business Dining">Business Dining (15%)</Option>
                  <Option value="Happy Hour">Happy Hour (12%)</Option>
                  <Option value="Loyalty Reward">Loyalty Reward (10%)</Option>
                  <Option value="Weekend Delight">Weekend Delight (20%)</Option>
                  <Option value="Festive Benefit">Festive Benefit (10%)</Option>
                  <Option value="House Courtesy">House Courtesy (100%)</Option>
                  <Option value="Exceptional Approval">Exceptional Approval (Custom %)</Option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Discount Rate (%)
                </label>
                <InputNumber
                  size="large"
                  min={0}
                  max={100}
                  step={0.01}
                  precision={2}
                  value={discountPercent}
                  onChange={(val) => setDiscountPercent(val !== null ? val : 0)}
                  className="w-full rounded-xl"
                />
              </div>
            </div>

            {/* Calculations Breakdown Card */}
            {baseBill && baseBill > 0 ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase font-medium text-[10px]">Original Bill Amount</span>
                  <strong className="text-slate-800 text-sm font-semibold">₹{baseBill}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-medium text-[10px]">Discount Rate</span>
                  <strong className="text-slate-800 text-sm font-semibold">{discountPercent.toFixed(2)}%</strong>
                </div>
                <div className="border-t border-slate-200/60 pt-2">
                  <span className="text-emerald-700 block uppercase font-semibold text-[10px]">Loyalty Benefit Credit</span>
                  <strong className="text-emerald-700 text-sm font-bold">₹{calculatedDiscount.toFixed(2)}</strong>
                </div>
                <div className="border-t border-slate-200/60 pt-2">
                  <span className="text-slate-700 block uppercase font-semibold text-[10px]">Payable Net Bill</span>
                  <strong className="text-slate-900 text-sm font-bold">₹{finalBill.toFixed(2)}</strong>
                </div>
              </div>
            ) : null}

            {/* HIGH-CONTRAST PRIMARY BUTTON */}
            <motion.button 
              type="submit"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              disabled={generating || !baseBill || baseBill <= 0 || !billNumber || !customerPhone.trim() || customerPhone.trim().length < 10}
              className={`w-full py-3.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 select-none shadow-sm ${
                generating || !baseBill || baseBill <= 0 || !billNumber || !customerPhone.trim() || customerPhone.trim().length < 10
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  : 'bg-[#1E4D2B] hover:bg-[#163a20] text-white shadow-emerald-900/10'
              }`}
            >
              {generating ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Committing to Ledger...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Voucher QR</span>
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* Right Panel: Voucher Pass Preview Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-base">
              <QrCode size={18} className="text-[#1E4D2B]" />
              <span>Voucher Pass Preview</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Step 2 of 2</span>
          </div>

          {activeCoupon ? (
            <div className="text-center space-y-4 my-auto py-2">
              <div className="inline-block p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
                <QRCodeCanvas 
                  id={`qr-canvas-${activeCoupon.token}`} 
                  value={getVerificationUrl(activeCoupon)} 
                  size={150} 
                  includeMargin 
                />
              </div>

              <div className="space-y-1">
                <div className="flex gap-2 justify-center">
                  {activeCoupon.isCancelled ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                      Cancelled
                    </span>
                  ) : activeCoupon.isUsed ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                      Redeemed
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active in Ledger
                    </span>
                  )}
                </div>
                <div className="font-mono text-sm font-bold text-slate-800 tracking-wider">
                  {activeCoupon.token}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-left text-xs space-y-1.5 font-sans">
                <div className="flex justify-between">
                  <span className="text-slate-400">Bill Number:</span>
                  <span className="font-mono font-semibold text-slate-800">{activeCoupon.billNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Discount Credit:</span>
                  <strong className="text-emerald-700 font-bold">₹{activeCoupon.discountValue} ({activeCoupon.discountPercent}%)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Validity:</span>
                  <span className="font-mono text-slate-700 font-medium">17 Days ({expiryDateFormatted})</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => copyToClipboard(activeCoupon.token)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 select-none"
                >
                  <CopyOutlined /> Copy Code
                </button>
                <button 
                  onClick={() => downloadQRCodeFile(activeCoupon.token)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 select-none"
                >
                  <DownloadOutlined /> Download QR
                </button>
              </div>

              {activeCoupon.phone && activeCoupon.phone !== 'Walk-in' && !activeCoupon.isCancelled && !activeCoupon.isUsed && (
                <a 
                  href={getWhatsAppRedirectionUrl(activeCoupon)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 select-none mt-2"
                >
                  <WhatsAppOutlined /> Send WhatsApp Voucher
                </a>
              )}
            </div>
          ) : (
            <div className="text-center my-auto py-12 text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Ticket size={28} />
              </div>
              <h4 className="font-semibold text-slate-700 text-sm">Voucher Pass Standby</h4>
              <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                Enter receipt details on the left to generate and issue a customer loyalty QR voucher.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Admin Ledger Panel */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 font-semibold text-slate-900 text-base">
            <Calendar size={18} className="text-[#1E4D2B]" />
            <span>Voucher Issuance Ledger</span>
          </div>

          {/* Search controls */}
          <div className="relative max-w-md w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input 
              type="text"
              placeholder="Search by Bill No, phone, or token..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Clean Enterprise Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Bill Number</th>
                <th className="py-3 px-4">Customer Phone</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Credit Value</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No voucher records found matching your query.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v) => {
                  const isExpired = Date.now() > v.expiryEpoch;
                  const disableActions = v.isUsed || v.isCancelled || isExpired;

                  return (
                    <tr key={v.token} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(v.createdAt).toISOString().split('T')[0]}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {v.billNo}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {v.phone}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {v.discountCategory}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-800">
                        ₹{v.discountValue} <span className="text-[10px] font-normal text-slate-400">({v.discountPercent}%)</span>
                      </td>
                      <td className="py-3 px-4">
                        {v.isCancelled ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                            Cancelled
                          </span>
                        ) : v.isUsed ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            Redeemed
                          </span>
                        ) : isExpired ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Expired
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Tooltip title="View Pass Details">
                            <button 
                              onClick={() => setViewVoucherModal(v)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              <QrCode size={14} />
                            </button>
                          </Tooltip>
                          <Tooltip title="Copy Token">
                            <button 
                              onClick={() => copyToClipboard(v.token)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              <CopyOutlined size={14} />
                            </button>
                          </Tooltip>
                          {v.phone && v.phone !== 'Walk-in' && (
                            <Tooltip title="Send WhatsApp">
                              <a 
                                href={getWhatsAppRedirectionUrl(v)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
                              >
                                <WhatsAppOutlined size={14} />
                              </a>
                            </Tooltip>
                          )}
                          {!disableActions && (
                            <>
                              <Tooltip title="Mark Redeemed">
                                <button 
                                  onClick={() => redeemVoucherManually(v.token)}
                                  className="p-1.5 hover:bg-sky-50 rounded-lg text-sky-600 transition-colors"
                                >
                                  <CheckCircleOutlined size={14} />
                                </button>
                              </Tooltip>
                              <Tooltip title="Cancel Voucher">
                                <button 
                                  onClick={() => cancelVoucher(v.token)}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors"
                                >
                                  <CloseCircleOutlined size={14} />
                                </button>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Voucher Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 font-semibold text-slate-900 text-base">
            <Ticket size={18} className="text-[#1E4D2B]" />
            <span>Voucher Pass Details</span>
          </div>
        }
        open={!!viewVoucherModal}
        onCancel={() => setViewVoucherModal(null)}
        footer={null}
        width={420}
        styles={{ body: { padding: '12px 0' } }}
      >
        {viewVoucherModal && (
          <div className="text-center space-y-4 font-sans text-slate-800">
            <div className="inline-block p-4 bg-white border border-slate-200/90 rounded-2xl mx-auto shadow-xs">
              <QRCodeCanvas 
                id={`qr-canvas-${viewVoucherModal.token}`} 
                value={getVerificationUrl(viewVoucherModal)} 
                size={160} 
                includeMargin 
              />
            </div>
            
            <div className="space-y-1">
              <div className="font-mono text-sm font-bold text-slate-800">{viewVoucherModal.token}</div>
              <div>
                {viewVoucherModal.isCancelled ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                    Cancelled
                  </span>
                ) : viewVoucherModal.isUsed ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                    Redeemed
                  </span>
                ) : Date.now() > viewVoucherModal.expiryEpoch ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    Expired
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Pass
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-left text-xs space-y-2 font-sans">
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400">Bill Number:</span>
                <span className="font-mono font-semibold text-slate-800">{viewVoucherModal.billNo}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400">Base Receipt Bill:</span>
                <span className="font-bold text-slate-800">₹{viewVoucherModal.originalBill}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400">Promotion Category:</span>
                <span className="font-semibold text-slate-800">{viewVoucherModal.discountCategory}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400">Discount Rate:</span>
                <span className="font-bold text-slate-800">{viewVoucherModal.discountPercent.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400">Loyalty Benefit Credit:</span>
                <strong className="text-emerald-700 font-bold">₹{viewVoucherModal.discountValue}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400">Customer Mobile:</span>
                <span className="font-medium text-slate-800">{viewVoucherModal.phone}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400">Issued On:</span>
                <span className="font-mono text-slate-700">{new Date(viewVoucherModal.createdAt).toISOString().split('T')[0]}</span>
              </div>
              <div className="flex justify-between pb-0.5">
                <span className="text-slate-400">Expiry Date:</span>
                <span className="font-mono font-semibold text-rose-600">{new Date(viewVoucherModal.expiryEpoch).toISOString().split('T')[0]}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => copyToClipboard(viewVoucherModal.token)}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 select-none"
              >
                <CopyOutlined /> Copy Code
              </button>
              <button 
                onClick={() => downloadQRCodeFile(viewVoucherModal.token)}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 select-none"
              >
                <DownloadOutlined /> Download QR
              </button>
            </div>

            {viewVoucherModal.phone && viewVoucherModal.phone !== 'Walk-in' && (
              <a 
                href={getWhatsAppRedirectionUrl(viewVoucherModal)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 select-none block mt-2"
              >
                <WhatsAppOutlined /> Send WhatsApp Voucher
              </a>
            )}
          </div>
        )}
      </Modal>

      {/* ONLINE BILL PRINTING MODAL FOR ALL PAPER SIZES */}
      <Modal
        open={showPrintModal}
        onCancel={() => setShowPrintModal(false)}
        footer={null}
        width={paperSize === 'A4' ? 820 : paperSize === 'A5' ? 620 : 440}
        title={
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Printer size={16} className="text-[#1E4D2B]" />
            <span>Online Bill &amp; Receipt Printer</span>
          </div>
        }
      >
        <div className="space-y-4 pt-2 font-sans">
          {/* Paper Size Selector Tabs */}
          <div className="bg-slate-100 p-1.5 rounded-xl flex items-center justify-between gap-1 text-xs font-medium">
            <span className="text-slate-500 font-semibold px-2 uppercase text-[10px] hidden sm:inline">Paper Format:</span>
            <div className="grid grid-cols-4 gap-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setPaperSize('80mm')}
                className={`py-1.5 px-3 rounded-lg transition-all text-center text-xs ${
                  paperSize === '80mm' ? 'bg-[#1E4D2B] text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                80mm POS
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('58mm')}
                className={`py-1.5 px-3 rounded-lg transition-all text-center text-xs ${
                  paperSize === '58mm' ? 'bg-[#1E4D2B] text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                58mm Mini
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('A4')}
                className={`py-1.5 px-3 rounded-lg transition-all text-center text-xs ${
                  paperSize === 'A4' ? 'bg-[#1E4D2B] text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                A4 Invoice
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('A5')}
                className={`py-1.5 px-3 rounded-lg transition-all text-center text-xs ${
                  paperSize === 'A5' ? 'bg-[#1E4D2B] text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                A5 Half Page
              </button>
            </div>
          </div>

          {/* Printable Bill Receipt Preview Area */}
          <div className="bg-slate-200/60 p-4 rounded-xl max-h-[60vh] overflow-y-auto flex justify-center">
            <div
              id="printable-bill-area"
              className={`bg-white text-slate-900 shadow-md p-4 rounded border border-slate-300 font-mono transition-all ${
                paperSize === '58mm' ? 'w-[220px] text-[10px]' : paperSize === '80mm' ? 'w-[300px] text-xs' : paperSize === 'A5' ? 'w-[500px] text-xs font-sans' : 'w-[700px] text-sm font-sans'
              }`}
            >
              {/* Header */}
              <div className="text-center border-b border-slate-900/40 pb-3 mb-3 space-y-1">
                <h2 className="font-bold text-base uppercase tracking-tight text-slate-900">Balaji Chilkur Family Dhaba</h2>
                <p className="text-[10px] text-slate-600">Vikarabad Highway, Chilkur X Road, TS</p>
                <p className="text-[10px] text-slate-600">Ph: +91 93471 04569 | GSTIN: 36ABCDE1234F1Z5</p>
                <div className="mt-2 inline-block border border-slate-800 px-2 py-0.5 font-bold text-[10px] uppercase">
                  Tax Invoice / Bill Receipt
                </div>
              </div>

              {/* Bill Meta Details */}
              <div className="text-[11px] border-b border-slate-900/40 pb-2 mb-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Bill / Inv No:</span>
                  <span className="font-bold">{billNumber || 'BSD-POS-001'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Date &amp; Time:</span>
                  <span>{new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Customer Phone:</span>
                  <span className="font-bold">{customerPhone || 'Walk-in Guest'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Promotion:</span>
                  <span>{discountCategory} ({discountPercent}%)</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border-b border-slate-900/40 pb-3 mb-3">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-800 font-bold">
                      <th className="py-1">Item Description</th>
                      <th className="py-1 text-center">Qty</th>
                      <th className="py-1 text-right">Rate</th>
                      <th className="py-1 text-right">Amt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {orderItems.length > 0 ? (
                      orderItems.map((item) => (
                        <tr key={item.id}>
                          <td className="py-1 font-medium">{item.name}</td>
                          <td className="py-1 text-center">{item.quantity}</td>
                          <td className="py-1 text-right">₹{item.unitPrice}</td>
                          <td className="py-1 text-right font-semibold">₹{item.totalPrice}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-1 font-medium" colSpan={3}>Dhaba Dining Bill Amount</td>
                        <td className="py-1 text-right font-semibold">₹{baseBill || 0}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Calculation Summary */}
              <div className="text-[11px] space-y-1 border-b border-slate-900/40 pb-3 mb-3">
                <div className="flex justify-between text-slate-700">
                  <span>Gross Subtotal:</span>
                  <span>₹{baseBill || 0}</span>
                </div>
                {calculatedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-medium">
                    <span>Discount ({discountPercent}%):</span>
                    <span>-₹{calculatedDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-800">
                  <span>Net Payable Amount:</span>
                  <span>₹{finalBill.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer & QR */}
              <div className="text-center text-[10px] space-y-2 pt-1">
                {activeCoupon && (
                  <div className="flex flex-col items-center justify-center my-2">
                    <QRCodeCanvas value={`https://balajichilkur.com/menu?claimBonusToken=${activeCoupon.token}`} size={70} />
                    <span className="font-bold text-[9px] mt-1">Token: {activeCoupon.token}</span>
                  </div>
                )}
                <p className="font-semibold text-slate-800">Thank you for dining at Balaji Chilkur Family Dhaba!</p>
                <p className="text-slate-500">Please visit again. Have a delicious day!</p>
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">Selected Format: <strong className="text-slate-900">{paperSize}</strong></span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-4 bg-[#1E4D2B] hover:bg-[#163a20] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Printer size={15} />
                <span>Print Bill Now</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Global CSS for Window Print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-bill-area, #printable-bill-area * {
            visibility: visible !important;
          }
          #printable-bill-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: ${paperSize === '58mm' ? '58mm' : paperSize === '80mm' ? '80mm' : '100%'} !important;
            margin: 0 !important;
            padding: 10px !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: ${paperSize === '80mm' ? '80mm auto' : paperSize === '58mm' ? '58mm auto' : paperSize === 'A4' ? 'A4 portrait' : 'A5 portrait'};
            margin: 0;
          }
        }
      ` }} />
    </div>
  );
}

export default function CheckoutRewardsPage() {
  return (
    <App>
      <CheckoutRewardsContent />
    </App>
  );
}
