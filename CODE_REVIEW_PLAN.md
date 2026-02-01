# RENCANA CODE REVIEW: Badminton Booking System

## 1. STRUKTUR CODEBASE
Berdasarkan analisis, struktur proyek ini menggunakan **Next.js 16 (App Router)** dengan **Typescript** dan **Supabase**.

- **`src/app`**: Routing utama & Pages.
- **`src/lib`**: Backend logic, Supabase client, Auth helpers.
- **`src/components`**: UI Components (Reusable & Feature-specific).
- **`middleware.ts`**: Edge middleware untuk proteksi route.

## 2. KOMPONEN UTAMA
Kami telah mengidentifikasi komponen kritikal berikut:

1.  **Authentication & Security** (Critical)
    - Files: `src/middleware.ts`, `src/lib/auth/`, `src/components/AuthModal.tsx`
2.  **Booking Engine** (Core Business)
    - Files: `src/components/BookingSection.tsx`, `src/components/SchedulingCalendar.tsx`
3.  **Partner Onboarding** (Complex Forms)
    - Files: `src/components/PartnerOnboarding.tsx`
4.  **AI Coach** (External Integration)
    - Files: `src/components/AICoach.tsx`

---

## 3. STEP-BY-STEP REVIEW PLAN

### **Session 1: Foundation & Security (Prioritas Tertinggi)**
Fokus pada keamanan aplikasi, proteksi data, dan manajemen sesi user sebelum melihat fitur bisnis.

- **Target Files**:
    - `src/middleware.ts`
    - `src/lib/supabase/` (Client & Server configurations)
    - `src/app/auth/*`
    - `src/components/AuthModal.tsx`
- **Checklist**:
    - [ ] Middleware matcher regex sudah tepat & aman?
    - [ ] Apakah session validation berjalan di server-side?
    - [ ] Error handling saat login/register (UX & Security).
    - [ ] Env variables leakage check.
- **Estimasi Kompleksitas**: **Tinggi**

### **Session 2: Booking System Logic (Core Business)**
Review logika utama pemesanan lapangan. Ini adalah area dengan risiko bug terbesar.

- **Target Files**:
    - `src/components/BookingSection.tsx`
    - `src/components/SchedulingCalendar.tsx`
    - `src/app/booking/page.tsx`
- **Checklist**:
    - [ ] Pencegahan double-booking (Race conditions).
    - [ ] Validasi timezone (WIB/UTC) pada tanggal booking.
    - [ ] State management performance (Re-renders).
    - [ ] Error recovery jika transaksi gagal di tengah jalan.
- **Estimasi Kompleksitas**: **Sangat Tinggi**

### **Session 3: Feature Modules (Partner & AI)**
Review fitur pendukung yang melibatkan input user yang kompleks.

- **Target Files**:
    - `src/components/PartnerOnboarding.tsx`
    - `src/components/AICoach.tsx`
- **Checklist**:
    - [ ] Form validation (Client-side & Server-side).
    - [ ] Security pada endpoint AI (Rate limiting/Auth).
    - [ ] Data handling untuk upload file/gambar (jika ada).
    - [ ] User feedback loops (Loading states).
- **Estimasi Kompleksitas**: **Sedang**

### **Session 4: UI/UX & Performance Polish**
Final pass untuk memastikan kualitas visual dan performa frontend.

- **Target Files**:
    - `src/components/Navbar.tsx`, `Footer.tsx`
    - `src/components/Hero.tsx`, `BentoGrid.tsx`
    - `src/app/globals.css`
- **Checklist**:
    - [ ] Responsive design check (Mobile/Tablet breakpoints).
    - [ ] Image optimization (`next/image`).
    - [ ] Component reusability (DRY).
    - [ ] Accessibility (ARIA labels).
- **Estimasi Kompleksitas**: **Rendah**

---

## 4. NEXT STEPS
Silakan konfirmasi untuk memulai **Session 1: Foundation & Security**.
