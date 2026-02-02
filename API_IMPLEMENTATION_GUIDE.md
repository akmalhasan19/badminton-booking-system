# Panduan Implementasi Integrasi API (Website <-> PWA Smash)

Dokumen ini adalah **Petunjuk Teknis** bagi Developer Website untuk mengintegrasikan sistem booking dengan PWA Smash (Backend).
Semua endpoint berikut **SUDAH TERSEDIA** dan siap digunakan.

---

## 2. Daftar Endpoint Tersedia

### A. Informasi Venue & Lapangan (Tampilan Depan)

#### 1. Get Venue Profile
*   **Endpoint**: `GET /api/external/v1/venues/{id}`
*   **Fungsi**: Mengambil data nama GOR, alamat, fasilitas, dan foto banner.
*   **Contoh Response**:
    ```json
    {
      "name": "GOR Smash Juara",
      "address": "Jl. Raya Badminton No. 1",
      "facilities": ["Wifi", "Toilet", "Kantin"],
      "photos": ["https://url..."]
    }
    ```

#### 2. Get Court List
*   **Endpoint**: `GET /api/external/v1/courts`
*   **Fungsi**: Mengambil daftar lapangan beserta harga, **deskripsi, dan foto lapangan**.
*   **Response Baru**: Termasuk field `description` dan `photo_url` (array).

### B. Proses Booking

#### 3. Cek Ketersediaan (Real-time)
*   **Endpoint**: `GET /api/external/v1/bookings/availability`
*   **Query Params**: `?venueId=...&date=YYYY-MM-DD`
*   **Fungsi**: Mengembalikan daftar slot waktu yang *occupied* (terisi). Gunakan untuk mendisable jam pada UI Calendar.

#### 4. Buat Booking Baru
*   **Endpoint**: `POST /api/external/v1/bookings`
*   **Fungsi**: Membuat reservasi baru saat user checkout.
*   **Status Awal**: `pending`.

#### 5. Update Status Pembayaran (Webhook/Callback)
*   **Endpoint**: `PATCH /api/external/v1/bookings/{id}/payment`
*   **Fungsi**: Mengupdate status booking setelah pembayaran berhasil di Payment Gateway.
*   **Body**: `{ "status": "LUNAS" }`
*   **Effect**: Status booking berubah menjadi `confirmed` di database PWA Smash.

---

## 3. Checklist Integrasi

Gunakan checklist ini untuk memverifikasi integrasi di sisi Website:

- [ ] **Home Page**: Menampilkan Nama & Alamat GOR dari endpoint `/venues`.
- [ ] **Booking Page**: Menampilkan Foto & Deskripsi Lapangan dari endpoint `/courts`.
- [ ] **Calendar**: Slot waktu disable sesuai response `/availability`.
- [ ] **Checkout**: Berhasil POST ke `/bookings` dan menerima Booking ID.
- [ ] **Payment**: Setelah bayar sukses, panggil PATCH `/bookings/.../payment` untuk konfirmasi otomatis.
