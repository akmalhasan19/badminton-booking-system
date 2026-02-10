# Backend Implementation Plan

Tanggal: 2026-02-10  
Lokasi file: root project `badminton-booking-system`

## Tujuan
- Menutup gap backend yang saat ini masih mock, dummy, atau belum terintegrasi.
- Menyediakan urutan implementasi yang aman, terukur, dan bisa dieksekusi bertahap.
- Menjaga kompatibilitas dengan alur yang sudah dipakai frontend.

## Scope Prioritas
1. External API v1 compliance (partner/public integration)
2. Notifications end-to-end
3. Community Reviews end-to-end
4. Report and Moderation backend
5. Coach discovery and booking backend
6. Remaining backend gaps (admin users, challenge mode, settings persist, shop/newsletter)

## Prinsip Eksekusi
- Gunakan incremental delivery: 1 lane selesai dulu sebelum lane berikutnya.
- Semua perubahan schema lewat migration versioned.
- Tambahkan test minimal untuk contract dan business-critical logic.
- Backward-compatible dulu (support payload lama + baru), lalu cleanup.

---

## Lane 1 - External API v1 Compliance (P0)

### Outcome
- Endpoint v1 sesuai integration guide.
- Payload konsisten snake_case.
- Tidak ada hardcoded placeholder untuk venue detail.

### Step-by-step
1. Freeze API contract
- Finalisasi contract request/response:
  - `GET /api/external/v1/venues`
  - `GET /api/external/v1/venues/{id}`
  - `GET /api/external/v1/venues/{id}/courts`
  - `GET /api/external/v1/venues/{id}/availability`
  - `GET /api/external/v1/bookings`
  - `POST /api/external/v1/bookings`
  - `PATCH /api/external/v1/bookings/{id}/payment`

2. Implement route yang belum ada
- Tambahkan route list venues (`/v1/venues`).
- Tambahkan route list bookings (`/v1/bookings` GET).

3. Rapikan route yang sudah ada
- `venues/[id]`: ganti hardcoded data dengan query DB.
- `bookings/availability`: ganti field `duration` ke `duration_hours`.
- `bookings POST`: terima snake_case sebagai utama, tetap support camelCase sementara.

4. Hilangkan fallback berisiko
- Stop assign `user_id` ke user pertama di DB.
- Pilih salah satu:
  - system integration user yang eksplisit, atau
  - nullable integration owner field khusus.

5. Tambahkan validasi dan error code konsisten
- Validation 400, auth 401, forbidden 403, conflict 409, internal 500.
- Error format seragam di semua route.

6. Test
- Contract test per endpoint.
- Negative test (invalid payload, unauthorized, not found, conflict).
- Smoke test dari client integrasi.

### Definition of Done
- Semua endpoint v1 mandatory tersedia.
- Tidak ada hardcoded venue response.
- Response schema match dengan guide.

---

## Lane 2 - Notifications End-to-End (P0)

### Outcome
- Halaman notifikasi membaca data real.
- Mark read / mark all read benar-benar persist ke DB.
- Settings notifikasi tersimpan, bukan state lokal saja.

### Step-by-step
1. DB design + migration
- Buat tabel `notifications`:
  - `id`, `user_id`, `type`, `title`, `message`, `metadata`, `read`, `created_at`
- Buat tabel `notification_preferences`:
  - `user_id`, `account_email`, `account_push`, `exclusive_email`, `exclusive_push`, `reminder_email`, `reminder_push`
- Index:
  - `(user_id, created_at desc)`, `(user_id, read)`

2. Server actions/API
- Implement:
  - `fetchNotifications`
  - `markNotificationAsRead`
  - `markAllNotificationsAsRead`
  - `getNotificationPreferences`
  - `updateNotificationPreferences`

3. Integrasi UI
- `notifications/page.tsx` pakai data real + optimistic update aman.
- `settings/notifications/page.tsx` load/save preferences ke backend.

4. Producer events
- Trigger notifikasi dari event penting (booking confirmed/cancelled/payment reminder).

5. Test
- Unit test action.
- Integration test read/unread flow.

### Definition of Done
- Notifikasi tampil real-time basis DB (minimal fetch on load).
- Toggle settings persist dan survive refresh.

---

## Lane 3 - Community Reviews End-to-End (P1)

### Outcome
- Halaman review komunitas tidak dummy.
- Rating di `CommunityStats` berasal dari agregasi data nyata.

### Step-by-step
1. DB modeling
- Buat tabel `community_reviews`:
  - `id`, `community_id`, `reviewer_user_id`, `rating`, `comment`, `tags`, `created_at`
- Optional: `community_review_metrics` untuk cache agregasi.

2. Backend query layer
- Query list reviews dengan filter:
  - search keyword
  - newest
  - highest rating
  - with media (opsional)
- Query aggregate:
  - overall rating
  - total reviews
  - kategori/criteria summary

3. Integrasi page
- Ganti `reviewsData` dummy di `communities/[id]/reviews/page.tsx`.
- Tambahkan pagination/cursor.

4. Hubungkan `CommunityStats`
- `rating` dikirim dari data komunitas/agregat, bukan default statis.

5. Test
- Aggregation correctness.
- Access control review creation (1 user bisa review policy sesuai rule bisnis).

### Definition of Done
- Tidak ada dummy data review di UI.
- Nilai rating card sinkron dengan data review aktual.

---

## Lane 4 - Report and Moderation Backend (P1)

### Outcome
- Report komunitas dan report message tersimpan.
- Ada alur penanganan moderation minimal.

### Step-by-step
1. DB + migration
- Buat tabel `reports`:
  - `id`, `reporter_user_id`, `target_type` (`community|message`), `target_id`, `reason`, `description`, `status`, `created_at`
- Buat tabel `report_actions`:
  - `id`, `report_id`, `admin_user_id`, `action`, `notes`, `created_at`

2. Backend actions
- `submitCommunityReport`
- `submitMessageReport`
- `listReportsForAdmin`
- `resolveReport`

3. Integrasi UI
- `ReportModal`: ganti simulate call ke backend call.
- Message report menu: ganti toast-only ke submit action.

4. Admin moderation UI minimal
- Tampilkan queue report + status update.

5. Test
- Auth required.
- Reporter tidak bisa resolve.
- Admin flow works.

### Definition of Done
- Semua report masuk DB dan bisa ditindak admin.

---

## Lane 5 - Coach Discovery and Booking Backend (P1)

### Outcome
- Daftar coach bukan hardcoded.
- Booking session coach punya backend flow.

### Step-by-step
1. DB schema
- `coaches` (profile aktif)
- `coach_availability_slots`
- `coach_bookings`

2. API/actions
- `getCoaches` (search/filter city/level/specialization)
- `getCoachById`
- `getCoachAvailability`
- `createCoachBooking`

3. Integrasi UI
- `CoachSection`: replace `COACHES` constant dengan fetch backend.
- `CoachDetailModal`: availability real.
- CTA `Book Session` trigger booking flow.

4. Payment strategy (phase 2 opsional)
- Integrasi invoice/payment seperti booking court jika dibutuhkan.

5. Test
- Slot locking.
- Double booking prevention.

### Definition of Done
- Coach list + availability + booking session berjalan end-to-end.

---

## Lane 6 - Remaining Backend Gaps (P2)

### Items
1. Admin users management page
- Implement list/search/filter user + role update actions.

2. Challenge Mode activation
- Buat backend toggle/setting dan persistence.

3. Shop and newsletter integration
- Ganti mock products dengan data source real.
- Newsletter form submit ke provider/email list backend.

4. Booking location filter
- Tambah data lokasi terstruktur dan query backend untuk city/district/subdistrict.

---

## Urutan Eksekusi Rekomendasi
1. Lane 1 (API compliance)
2. Lane 2 (notifications)
3. Lane 3 (community reviews)
4. Lane 4 (report/moderation)
5. Lane 5 (coach booking)
6. Lane 6 (remaining)

Alasan:
- Lane 1 menurunkan risiko integrasi lintas sistem lebih dulu.
- Lane 2-4 berdampak langsung ke fitur user/community yang sudah ada UI-nya.
- Lane 5 dan 6 bisa paralel setelah fondasi stabil.

---

## Quality Gates per Lane
- Migration up/down berhasil.
- Lint + typecheck pass.
- Minimal smoke test untuk jalur utama.
- Error handling user-facing tidak bocor internal stack trace.
- Logging cukup untuk debug produksi.

## Risiko dan Mitigasi
- Risiko mismatch schema lama vs baru
  - Mitigasi: backward-compatible payload parser, deprecation bertahap.
- Risiko query agregasi berat
  - Mitigasi: index + materialized/summary table bila perlu.
- Risiko race condition booking/slot
  - Mitigasi: constraint DB + transaction + retry policy.

## Next Action (langsung bisa dikerjakan)
1. Mulai Lane 1 dengan checklist contract endpoint v1 + gap analysis final.
2. Buat migration draft untuk Lane 2 (`notifications`, `notification_preferences`).
3. Setup test skeleton untuk API contract dan server actions.

