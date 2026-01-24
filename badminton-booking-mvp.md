# MVP Features - Sistem Booking Lapangan Badminton

## Tech Stack
- **Frontend Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & Backend**: Supabase (PostgreSQL + Storage + Auth)
- **Deployment**: Vercel

---

## 🎯 MVP Features

### **A. User Management & Authentication**

**1. Role-based Users:**
- **Admin/Pemilik Lapangan**: Mengelola lapangan, melihat semua booking, atur harga
- **Customer/Pemain**: Booking lapangan, lihat history booking

**2. Authentication Features:**
- Register (email/password)
- Login/Logout
- Profile management (nama, no. HP, foto profile - optional untuk MVP)

---

### **B. Manajemen Lapangan (Admin Only)**

**1. CRUD Lapangan:**
- Tambah lapangan baru (Nama: "Lapangan 1", "Lapangan 2", dll)
- Edit detail lapangan
- Tandai lapangan sebagai maintenance/tidak tersedia
- Upload foto lapangan (Supabase Storage)

**2. Pengaturan Operasional:**
- Jam operasional (misal: 08:00 - 22:00)
- Durasi booking per slot (default: 1 jam)
- Harga per jam (bisa beda weekday vs weekend)

---

### **C. Sistem Booking (Customer)**

**1. Lihat Ketersediaan:**
- Calendar view untuk pilih tanggal
- Grid time slots menampilkan jam-jam yang tersedia
- Status: Tersedia (hijau) / Terboking (merah) / Sedang Berlangsung (kuning)
- Filter by lapangan

**2. Proses Booking:**
- Pilih tanggal
- Pilih lapangan
- Pilih jam mulai & durasi (1-3 jam)
- Review total harga
- Konfirmasi booking
- Input nama pemesan & no. HP (jika belum di profile)

**3. Status Booking:**
- **Pending**: Menunggu konfirmasi pembayaran
- **Confirmed**: Sudah dibayar & dikonfirmasi admin
- **Cancelled**: Dibatalkan
- **Completed**: Sudah selesai main

---

### **D. Dashboard Admin**

**1. Overview Hari Ini:**
- Total booking hari ini
- Revenue hari ini
- Lapangan paling populer
- Upcoming bookings (next 2-3 hours)

**2. Manajemen Booking:**
- List semua booking (filter by: tanggal, status, lapangan)
- Konfirmasi pembayaran (ubah status Pending → Confirmed)
- Cancel booking
- Lihat detail booking

**3. Laporan Sederhana:**
- Total revenue per hari/minggu/bulan
- Jumlah booking per lapangan
- Peak hours (jam tersibuk)

---

### **E. Dashboard Customer**

**1. My Bookings:**
- Upcoming bookings
- Past bookings (history)
- Status pembayaran

**2. Actions:**
- Cancel booking (jika masih > 2 jam sebelum waktu main)
- Lihat detail booking (QR code untuk check-in - optional)

---

### **F. Pembayaran (Simplified untuk MVP)**

**Untuk MVP, kita pakai manual confirmation:**
- Customer booking → status: Pending
- Sistem tampilkan nomor rekening / QRIS admin
- Customer upload bukti transfer (Supabase Storage)
- Admin verifikasi & konfirmasi manual → status: Confirmed

**Future enhancement:** Integrasi payment gateway (Midtrans/Xendit)

---

### **G. Notifikasi (Basic)**

**Via Email (menggunakan Supabase Edge Functions atau Resend):**
- Booking berhasil dibuat
- Booking dikonfirmasi admin
- Reminder H-1 sebelum main
- Booking dibatalkan

---

### **H. Public Pages**

**1. Landing Page:**
- Hero section dengan foto lapangan
- Daftar lapangan & harga
- Cara booking
- Kontak & lokasi
- CTA: "Book Sekarang"

**2. About/Info Page:**
- Alamat & map (Google Maps embed)
- Jam operasional
- Fasilitas (toilet, kantin, parkir, dll)
- Syarat & ketentuan

---

## 📋 Database Schema (Simplified)

### Tables Needed:

**1. users**
```sql
- id (uuid, primary key)
- email (text, unique)
- role (enum: 'admin' | 'customer')
- full_name (text)
- phone (text)
- avatar_url (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

**2. courts**
```sql
- id (uuid, primary key)
- name (text)
- description (text, nullable)
- image_url (text, nullable)
- is_active (boolean, default: true)
- created_by (uuid, foreign key to users)
- created_at (timestamp)
- updated_at (timestamp)
```

**3. bookings**
```sql
- id (uuid, primary key)
- court_id (uuid, foreign key to courts)
- user_id (uuid, foreign key to users)
- booking_date (date)
- start_time (time)
- end_time (time)
- duration_hours (integer)
- total_price (decimal)
- status (enum: 'pending' | 'confirmed' | 'cancelled' | 'completed')
- payment_proof_url (text, nullable)
- notes (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

**4. settings**
```sql
- id (uuid, primary key)
- key (text, unique)
- value (jsonb)
- created_at (timestamp)
- updated_at (timestamp)
```

**5. operational_hours**
```sql
- id (uuid, primary key)
- day_of_week (integer, 0-6, where 0 = Sunday)
- open_time (time)
- close_time (time)
- is_active (boolean, default: true)
- created_at (timestamp)
- updated_at (timestamp)
```

**6. pricing**
```sql
- id (uuid, primary key)
- court_id (uuid, foreign key to courts, nullable for default pricing)
- day_type (enum: 'weekday' | 'weekend')
- price_per_hour (decimal)
- created_at (timestamp)
- updated_at (timestamp)
```

---

## 🚀 MVP Priority (Phase Approach)

### **Phase 1 - Core (Week 1)**
- [ ] Authentication (register/login)
- [ ] Admin: CRUD lapangan
- [ ] Basic booking flow (pilih tanggal, lapangan, jam)
- [ ] View availability calendar

### **Phase 2 - Booking Management (Week 2)**
- [ ] Customer dashboard (my bookings)
- [ ] Admin dashboard (manage bookings)
- [ ] Payment proof upload
- [ ] Admin confirmation flow

### **Phase 3 - Polish (Week 3)**
- [ ] Landing page
- [ ] Email notifications
- [ ] Basic reporting
- [ ] Responsive design polish
- [ ] Deploy to Vercel

---

## 🎨 UI/UX Considerations

### Key Screens:
1. Landing page (public)
2. Login/Register
3. Booking page (calendar + time slots grid)
4. Customer dashboard
5. Admin dashboard
6. Court management page (admin)

### Design Inspiration:
- Airbnb (untuk calendar & availability)
- Google Calendar (untuk time slots)
- Simple, clean, mobile-first
