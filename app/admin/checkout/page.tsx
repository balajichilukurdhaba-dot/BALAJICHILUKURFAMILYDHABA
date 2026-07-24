"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, Input, InputNumber, Select, Button, Statistic, Typography, Space, Divider, Row, Col, Alert, Badge, Table, Modal, Tooltip, message, notification
} from 'antd';
import { 
  WhatsAppOutlined, CopyOutlined, DownloadOutlined, CloseCircleOutlined, CheckCircleOutlined, SearchOutlined, ReloadOutlined
} from '@ant-design/icons';
import { 
  DollarSign, Phone, Award, QrCode, Loader2, Sparkles, CheckCircle2, Ticket, FileText, Calendar
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

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

export default function CheckoutRewardsPage() {
  const router = useRouter();

  // Active client-side heartbeat hook executing router.refresh() on a continuous 4-second layout tree cache-busting cycle
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
  const [discountCategory, setDiscountCategory] = useState<string>('Happy Hour Special');
  const [discountPercent, setDiscountPercent] = useState<number>(12.00); // 12% default for Happy Hour Special

  // Generation response states
  const [generating, setGenerating] = useState(false);
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [viewVoucherModal, setViewVoucherModal] = useState<Coupon | null>(null);

  // Auto-calculated Dates
  const generatedDateFormatted = new Date().toISOString().split('T')[0];
  const validityDays = 17;
  const expiryEpoch = Date.now() + validityDays * 24 * 60 * 60 * 1000;
  const expiryDateFormatted = new Date(expiryEpoch).toISOString().split('T')[0];

  // Default Categories & predefined percentages
  const handleCategoryChange = (val: string) => {
    setDiscountCategory(val);
    if (val === 'Corporate Partner Privilege' || val === 'Corporate Discount') {
      setDiscountPercent(15.00);
    } else if (val === 'Happy Hour Special' || val === 'Happy Hour') {
      setDiscountPercent(12.00);
    } else if (val === 'Weekend Dining Benefit' || val === 'Weekend Offer') {
      setDiscountPercent(20.00);
    } else if (val === 'VIP Member Loyalty Reward' || val === 'Loyalty Reward') {
      setDiscountPercent(10.00);
    } else if (val === 'Festive Season Offer' || val === 'Festival Offer') {
      setDiscountPercent(10.00);
    } else if (val === 'Manager Courtesy Concession' || val === 'Staff Courtesy') {
      setDiscountPercent(100.00);
    } else if (val === 'Custom Manager Adjustment' || val === 'Manual Custom') {
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

    setGenerating(true);

    const payload = {
      originalBill: baseBill,
      phone: customerPhone.trim() || 'Walk-in',
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
          message: 'Voucher Created',
          description: `Voucher ${data.token} has been successfully generated for bill ${billNumber}.`,
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

  // Compile secure target verification URL
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

  // Filter vouchers by search query safely
  const filteredVouchers = vouchers.filter(v => {
    if (!v) return false;
    const query = searchQuery.toLowerCase();
    const tokenMatch = v.token ? String(v.token).toLowerCase().includes(query) : false;
    const billNoMatch = v.billNo ? String(v.billNo).toLowerCase().includes(query) : false;
    const phoneMatch = v.phone ? String(v.phone).toLowerCase().includes(query) : false;
    return tokenMatch || billNoMatch || phoneMatch;
  });

  // Table Columns config
  const columns = [
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (dateStr: string) => <span className="font-mono text-zinc-500 text-xs">{new Date(dateStr).toISOString().split('T')[0]}</span>
    },
    {
      title: 'Bill Number',
      dataIndex: 'billNo',
      key: 'billNo',
      render: (val: string) => <span className="font-mono font-bold text-zinc-800 text-xs">{val}</span>
    },
    {
      title: 'Customer Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (val: string) => <span className="font-sans text-xs text-zinc-700">{val}</span>
    },
    {
      title: 'Credit Amount',
      key: 'discountValue',
      render: (_: any, record: Coupon) => (
        <span className="font-bold text-[#1E4D2B] text-xs">
          ₹{record.discountValue} <Text type="secondary" style={{ fontSize: '10px' }}>({record.discountPercent}%)</Text>
        </span>
      )
    },
    {
      title: 'Category',
      dataIndex: 'discountCategory',
      key: 'discountCategory',
      render: (val: string) => <Badge count={val} color="#1E4D2B" style={{ fontSize: '9px', fontWeight: 'bold' }} />
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: Coupon) => {
        const isExpired = Date.now() > record.expiryEpoch;
        if (record.isCancelled) return <Badge status="default" text={<span className="text-zinc-400 font-bold uppercase text-[9px]">Cancelled</span>} />;
        if (record.isUsed) return <Badge status="success" text={<span className="text-emerald-600 font-bold uppercase text-[9px]">Redeemed</span>} />;
        if (isExpired) return <Badge status="error" text={<span className="text-rose-600 font-bold uppercase text-[9px]">Expired</span>} />;
        return <Badge status="processing" text={<span className="text-[#1E4D2B] font-bold uppercase text-[9px]">Active</span>} />;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Coupon) => {
        const isExpired = Date.now() > record.expiryEpoch;
        const disableActions = record.isUsed || record.isCancelled || isExpired;
        return (
          <Space size="middle">
            <Tooltip title="View Details">
              <Button size="small" type="text" icon={<QrCode size={14} />} onClick={() => setViewVoucherModal(record)} />
            </Tooltip>
            <Tooltip title="Copy Token">
              <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyToClipboard(record.token)} />
            </Tooltip>
            {record.phone && record.phone !== 'Walk-in' && (
              <Tooltip title="Send WhatsApp">
                <Button 
                  size="small" 
                  type="text" 
                  icon={<WhatsAppOutlined style={{ color: '#25D366' }} />} 
                  href={getWhatsAppRedirectionUrl(record)}
                  target="_blank"
                />
              </Tooltip>
            )}
            {!disableActions && (
              <>
                <Tooltip title="Mark Redeemed">
                  <Button 
                    size="small" 
                    type="text" 
                    icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />} 
                    onClick={() => redeemVoucherManually(record.token)} 
                  />
                </Tooltip>
                <Tooltip title="Cancel Voucher">
                  <Button 
                    size="small" 
                    type="text" 
                    danger
                    icon={<CloseCircleOutlined />} 
                    onClick={() => cancelVoucher(record.token)} 
                  />
                </Tooltip>
              </>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn font-sans max-w-7xl mx-auto" style={{ background: '#FFFFFF' }}>
      
      {/* Page Header Header */}
      <Card 
        variant="borderless" 
        style={{ background: '#FFFFFF', border: '1px solid #F5E6E3', borderRadius: 16 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#1E4D2B] flex items-center gap-1.5">
              <Award size={12} className="text-[#1E4D2B]" />
              Zomato & Swiggy Loyalty retention system
            </span>
            <Title level={2} style={{ margin: '8px 0 0 0', fontWeight: 900 }}>
              Checkout Incentives Manager
            </Title>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              Issue customized discount vouchers based on billing value and track counter redemption history.
            </Text>
          </div>
        </div>
      </Card>

      <Row gutter={[24, 24]} align="stretch">
        
        {/* Checkout Billing Input Panel */}
        <Col xs={24} md={12}>
          <Card 
            title={
              <Space>
                <DollarSign size={16} className="text-[#1E4D2B]" />
                <span>Base Bill Processing Grid</span>
              </Space>
            }
            variant="borderless" 
            style={{ height: '100%', border: '1px solid #F5E6E3', borderRadius: 16 }}
          >
            <form onSubmit={handleGenerate} className="space-y-4">
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong style={{ fontSize: '10px', textTransform: 'uppercase', color: '#666', display: 'block', marginBottom: '6px' }}>
                    Bill / Invoice Number *
                  </Text>
                  <Input 
                    size="large"
                    required
                    placeholder="e.g. INV-2026-00125" 
                    prefix={<FileText size={14} className="text-gray-400" />}
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value.toUpperCase())}
                    className="rounded-lg font-mono text-sm"
                    style={{ border: '1px solid #F5E6E3' }}
                  />
                </Col>

                <Col span={12}>
                  <Text strong style={{ fontSize: '10px', textTransform: 'uppercase', color: '#666', display: 'block', marginBottom: '6px' }}>
                    Base Bill Total (₹) *
                  </Text>
                  <InputNumber
                    size="large"
                    required
                    min={1}
                    placeholder="e.g. 1500" 
                    prefix={<span className="text-gray-400 font-bold text-sm">₹</span>}
                    value={baseBill}
                    onChange={(val) => setBaseBill(val)}
                    className="w-full rounded-lg"
                    style={{ border: '1px solid #F5E6E3' }}
                  />
                </Col>
              </Row>

              <div>
                <Text strong style={{ fontSize: '10px', textTransform: 'uppercase', color: '#666', display: 'block', marginBottom: '6px' }}>
                  Customer Phone Number
                </Text>
                <Input 
                  size="large"
                  placeholder="e.g. 9347104569" 
                  prefix={<Phone size={14} className="text-gray-400" />}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                  className="rounded-lg text-sm"
                  style={{ border: '1px solid #F5E6E3' }}
                />
              </div>

              <Divider style={{ margin: '8px 0' }} />

              <Row gutter={16}>
                <Col span={12}>
                  <Text strong style={{ fontSize: '10px', textTransform: 'uppercase', color: '#666', display: 'block', marginBottom: '6px' }}>
                    Promotion Category
                  </Text>
                  <Select
                    size="large"
                    value={discountCategory}
                    onChange={handleCategoryChange}
                    className="w-full"
                    style={{ border: '1px solid #F5E6E3', borderRadius: 8 }}
                  >
                    <Option value="Corporate Partner Privilege">Corporate Partner Privilege</Option>
                    <Option value="Happy Hour Special">Happy Hour Special</Option>
                    <Option value="Weekend Dining Benefit">Weekend Dining Benefit</Option>
                    <Option value="VIP Member Loyalty Reward">VIP Member Loyalty Reward</Option>
                    <Option value="Festive Season Offer">Festive Season Offer</Option>
                    <Option value="Manager Courtesy Concession">Manager Courtesy Concession</Option>
                    <Option value="Custom Manager Adjustment">Custom Manager Adjustment</Option>
                  </Select>
                </Col>

                <Col span={12}>
                  <Text strong style={{ fontSize: '10px', textTransform: 'uppercase', color: '#666', display: 'block', marginBottom: '6px' }}>
                    Discount Percentage (%)
                  </Text>
                  <InputNumber
                    size="large"
                    min={0}
                    max={100}
                    step={0.01}
                    precision={2}
                    value={discountPercent}
                    onChange={(val) => setDiscountPercent(val !== null ? val : 0)}
                    className="w-full rounded-lg"
                    style={{ border: '1px solid #F5E6E3' }}
                  />
                </Col>
              </Row>

              {/* Dynamic pricing engine preview cards */}
              {baseBill && baseBill > 0 ? (
                <div className="bg-[#FAF6EE] p-4 rounded-xl border border-dashed border-[#F5E6E3] grid grid-cols-2 gap-3 text-xs mt-3">
                  <div>
                    <span className="text-gray-400 block uppercase font-bold text-[9px]">Base Bill Amount:</span>
                    <strong className="text-zinc-800 text-sm">₹{baseBill}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block uppercase font-bold text-[9px]">Discount Percentage:</span>
                    <strong className="text-zinc-800 text-sm">{discountPercent.toFixed(2)}%</strong>
                  </div>
                  <div className="border-t border-zinc-150 pt-2">
                    <span className="text-[#1E4D2B] block uppercase font-black text-[9px]">Discount Value:</span>
                    <strong className="text-[#1E4D2B] text-sm">₹{calculatedDiscount.toFixed(2)}</strong>
                  </div>
                  <div className="border-t border-zinc-150 pt-2">
                    <span className="text-emerald-700 block uppercase font-black text-[9px]">Final Bill Value:</span>
                    <strong className="text-emerald-700 text-sm">₹{finalBill.toFixed(2)}</strong>
                  </div>
                </div>
              ) : null}

              <Button 
                type="primary" 
                htmlType="submit"
                size="large" 
                block
                disabled={generating || !baseBill || baseBill <= 0 || !billNumber}
                style={{ height: '46px', background: '#1E4D2B', borderColor: '#1E4D2B', borderRadius: 8, marginTop: 8 }}
              >
                {generating ? (
                  <Space>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Committing to Ledger...</span>
                  </Space>
                ) : (
                  <Space>
                    <Sparkles size={14} />
                    <span>Generate Secure Voucher QR</span>
                  </Space>
                )}
              </Button>
            </form>
          </Card>
        </Col>

        {/* Real-time Voucher Display Panel */}
        <Col xs={24} md={12}>
          <Card 
            title={
              <Space>
                <QrCode size={16} className="text-[#1E4D2B]" />
                <span>Immediate QR Code Payload</span>
              </Space>
            }
            variant="borderless" 
            style={{ height: '100%', border: '1px solid #F5E6E3', borderRadius: 16, display: 'flex', flexDirection: 'column' }}
            styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' } }}
          >
            {activeCoupon ? (
              <div className="text-center space-y-4 animate-fadeIn py-1">
                
                {/* Modern canvas-based QR rendering using project libraries */}
                <div className="inline-block p-4 bg-white border border-[#F5E6E3] rounded-2xl">
                  <QRCodeCanvas 
                    id={`qr-canvas-${activeCoupon.token}`} 
                    value={getVerificationUrl(activeCoupon)} 
                    size={160} 
                    includeMargin 
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex gap-2 justify-center">
                    {activeCoupon.isCancelled ? (
                      <Badge count="Cancelled" color="#bfbfbf" />
                    ) : activeCoupon.isUsed ? (
                      <Badge count="Redeemed" color="#52c41a" />
                    ) : (
                      <Badge count="Active in Ledger" color="#52c41a" />
                    )}
                  </div>
                  <div className="font-mono text-xs font-black text-gray-800 tracking-wider">
                    {activeCoupon.token}
                  </div>
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <Row gutter={8} className="bg-[#FAF6EE]/50 p-3 rounded-xl border border-[#F5E6E3] text-left text-xs">
                  <Col span={12} className="space-y-1.5 border-r border-[#F5E6E3] pr-2">
                    <div><Text type="secondary">Generated On:</Text> <span className="font-semibold font-mono">{generatedDateFormatted}</span></div>
                    <div><Text type="secondary">Expires On:</Text> <span className="font-semibold font-mono text-rose-600">{expiryDateFormatted}</span></div>
                  </Col>
                  <Col span={12} className="space-y-1.5 pl-2">
                    <div><Text type="secondary">Bill No:</Text> <span className="font-semibold font-mono">{activeCoupon.billNo}</span></div>
                    <div><Text type="secondary">Discount Credit:</Text> <strong className="text-[#1E4D2B]">₹{activeCoupon.discountValue}</strong></div>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col span={12}>
                    <Button 
                      block 
                      icon={<CopyOutlined />} 
                      onClick={() => copyToClipboard(activeCoupon.token)}
                    >
                      Copy Voucher
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button 
                      block 
                      icon={<DownloadOutlined />} 
                      onClick={() => downloadQRCodeFile(activeCoupon.token)}
                    >
                      Download QR
                    </Button>
                  </Col>
                </Row>

                {activeCoupon.phone && activeCoupon.phone !== 'Walk-in' && !activeCoupon.isCancelled && !activeCoupon.isUsed && (
                  <Button 
                    type="default" 
                    size="large"
                    icon={<WhatsAppOutlined />} 
                    href={getWhatsAppRedirectionUrl(activeCoupon)}
                    target="_blank"
                    block
                    style={{ background: '#25D366', color: '#FFFFFF', borderColor: '#25D366', fontWeight: 'bold', borderRadius: 8, height: '40px', marginTop: '4px' }}
                  >
                    Send WhatsApp Voucher
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 space-y-3">
                <Ticket size={44} className="mx-auto text-gray-200" />
                <Title level={5} style={{ color: '#aaa', margin: 0 }}>Voucher Standby</Title>
                <Paragraph style={{ color: '#bbb', fontSize: '11px', maxWidth: '240px', margin: '8px auto 0 auto' }}>
                  Input physical receipt details and set custom discount settings to generate customer loyalty QR code matrices.
                </Paragraph>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Admin Ledger Panel */}
      <Card 
        title={
          <Space>
            <Calendar size={16} className="text-[#1E4D2B]" />
            <span>Dining Vouchers Ledger</span>
          </Space>
        }
        variant="borderless" 
        style={{ border: '1px solid #F5E6E3', borderRadius: 16 }}
      >
        <div className="space-y-4">
          {/* Search controls */}
          <div className="max-w-md">
            <Input 
              placeholder="Search by Bill No, Phone, or Voucher Code..." 
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg"
              size="large"
              style={{ border: '1px solid #F5E6E3' }}
            />
          </div>

          <Table 
            dataSource={filteredVouchers}
            columns={columns}
            rowKey="token"
            loading={loadingLedger}
            pagination={{ pageSize: 10 }}
            className="border border-[#F5E6E3] rounded-xl overflow-hidden font-sans"
          />
        </div>
      </Card>

      {/* View Voucher Details Modal */}
      <Modal
        title={
          <Space>
            <Ticket size={18} className="text-[#1E4D2B] mt-1" />
            <span>Voucher Details Viewer</span>
          </Space>
        }
        open={!!viewVoucherModal}
        onCancel={() => setViewVoucherModal(null)}
        footer={null}
        width={420}
        styles={{ body: { padding: '12px 0' } }}
      >
        {viewVoucherModal && (
          <div className="text-center space-y-4 font-sans text-zinc-800">
            <div className="inline-block p-4 bg-white border border-[#F5E6E3] rounded-2xl mx-auto">
              <QRCodeCanvas 
                id={`qr-canvas-${viewVoucherModal.token}`} 
                value={getVerificationUrl(viewVoucherModal)} 
                size={160} 
                includeMargin 
              />
            </div>
            
            <div className="space-y-1">
              <div className="font-mono text-sm font-black text-gray-800">{viewVoucherModal.token}</div>
              <div>
                {viewVoucherModal.isCancelled ? (
                  <Badge count="Cancelled" color="#bfbfbf" />
                ) : viewVoucherModal.isUsed ? (
                  <Badge count="Redeemed" color="#52c41a" />
                ) : Date.now() > viewVoucherModal.expiryEpoch ? (
                  <Badge count="Expired" color="#f5222d" />
                ) : (
                  <Badge count="Active" color="#52c41a" />
                )}
              </div>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#F5E6E3] text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                <span className="text-gray-400 font-semibold">Bill / Invoice Number:</span>
                <span className="font-mono font-bold text-zinc-800">{viewVoucherModal.billNo}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                <span className="text-gray-400 font-semibold">Base Receipt Bill:</span>
                <span className="font-bold text-zinc-800">₹{viewVoucherModal.originalBill}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                <span className="text-gray-400 font-semibold">Discount Category:</span>
                <span className="font-bold text-zinc-800">{viewVoucherModal.discountCategory}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                <span className="text-gray-400 font-semibold">Discount Rate:</span>
                <span className="font-bold text-zinc-800">{viewVoucherModal.discountPercent.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                <span className="text-gray-400 font-semibold">Loyalty Reward Credit:</span>
                <strong className="text-[#1E4D2B]">₹{viewVoucherModal.discountValue}</strong>
              </div>
              <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                <span className="text-gray-400 font-semibold">Customer Mobile:</span>
                <span className="font-bold text-zinc-800">{viewVoucherModal.phone}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                <span className="text-gray-400 font-semibold">Voucher Created:</span>
                <span className="font-mono text-zinc-700">{new Date(viewVoucherModal.createdAt).toISOString().split('T')[0]}</span>
              </div>
              <div className="flex justify-between pb-0.5">
                <span className="text-gray-400 font-semibold">Voucher Expiry:</span>
                <span className="font-mono font-bold text-rose-600">{new Date(viewVoucherModal.expiryEpoch).toISOString().split('T')[0]}</span>
              </div>
            </div>

            <Row gutter={8}>
              <Col span={8}>
                <Button block onClick={() => copyToClipboard(viewVoucherModal.token)}>Copy Code</Button>
              </Col>
              <Col span={8}>
                <Button block onClick={() => downloadQRCodeFile(viewVoucherModal.token)}>Download QR</Button>
              </Col>
              <Col span={8}>
                {viewVoucherModal.phone && viewVoucherModal.phone !== 'Walk-in' ? (
                  <Button 
                    block 
                    type="primary" 
                    icon={<WhatsAppOutlined />} 
                    href={getWhatsAppRedirectionUrl(viewVoucherModal)}
                    target="_blank"
                    style={{ background: '#25D366', borderColor: '#25D366' }}
                  >
                    WhatsApp
                  </Button>
                ) : (
                  <Button block disabled>WhatsApp</Button>
                )}
              </Col>
            </Row>

            {!viewVoucherModal.isUsed && !viewVoucherModal.isCancelled && Date.now() <= viewVoucherModal.expiryEpoch && (
              <Row gutter={8} className="mt-2">
                <Col span={12}>
                  <Button 
                    block 
                    type="primary" 
                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                    onClick={() => redeemVoucherManually(viewVoucherModal.token)}
                  >
                    Mark Redeemed
                  </Button>
                </Col>
                <Col span={12}>
                  <Button block danger onClick={() => cancelVoucher(viewVoucherModal.token)}>Cancel Voucher</Button>
                </Col>
              </Row>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
