# 🍲 Balaji Chilkur Family Dhaba — Official Management Portal & Web App

[![Next.js](https://img.shields.io/badge/Framework-Next.js%2016-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-emerald?style=flat-square&logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployment-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)

---

### 🚀 Live Deployment Links

* **Vercel Production Site:** [https://bcfdfinal2026.vercel.app](https://bcfdfinal2026.vercel.app)
* **Admin Management Portal:** [https://bcfdfinal2026.vercel.app/admin](https://bcfdfinal2026.vercel.app/admin)
* **Table Reservations:** [https://bcfdfinal2026.vercel.app/reserve](https://bcfdfinal2026.vercel.app/reserve)

---

## ✨ Features & Architecture

### 🌐 Customer Web Application
- **Dynamic Menu Catalog:** Full food item catalog with category filtering, Telugu translations, signatures, and pricing.
- **Table Booking & Voucher System:** Instant online table reservation with automated QR token generation & discount voucher claims.
- **WhatsApp Direct Ordering:** One-click cart checkout via WhatsApp.
- **Customer Reviews & Ratings:** Live feedback submission with moderation.

### 🛡️ Executive Admin Management Portal (`/admin`)
- **6-Hour Session Security:** Automatic expiration and multi-device tab-focus auto-logout.
- **QR Code Scanner:** Hardware-accelerated 5ms QR voucher scanner with audio/haptic feedback.
- **Live Orders & Reservations:** Real-time table status updates (`Pending`, `Confirmed`, `Unclaimed`, `Claimed`, `Cancelled`).
- **Audit & Access Logs:** Geolocation, IP address, and timestamp tracking for admin sign-ins.
- **CMS Media Gallery:** Aspect-ratio optimized gallery management with featured homepage triggers.

---

## 🛠️ Technology Stack
- **Framework:** Next.js 16 (Turbopack + App Router)
- **Database:** Supabase PostgreSQL with Prisma ORM
- **Styling:** Tailwind CSS v4 & Lucide Icons
- **Deployment:** Vercel (Linux Serverless Edge)

---

## ⚙️ Vercel Environment Variables Configuration

Make sure the following Environment Variables are configured in **Vercel Project Settings > Environment Variables**:

| Variable Name | Description |
| :--- | :--- |
| `DATABASE_URL` | Supabase Transaction Pooler URL (`postgresql://...:6543/postgres?pgbouncer=true`) |
| `DIRECT_URL` | Supabase Direct Session URL (`postgresql://...:5432/postgres`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL (`https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key |
