# Security & Performance Hardening Plan (Security-First)

## Ringkasan
Dokumen ini adalah rencana implementasi dari temuan audit security dan performance yang sudah diidentifikasi, dengan strategi rollout `Security First` dan kebijakan debug `Prod Off + Dev/Admin`.

Tujuan utama:
1. Menutup attack surface kritikal (unauthorized mutation, debug exposure, internal endpoints).
2. Menurunkan risiko biaya operasional dari abuse (spam requests, webhook flood, email spam, log bloat).
3. Menjaga kompatibilitas flow bisnis utama (booking, payment, partner onboarding).

## Scope dan Kriteria Sukses
1. Semua endpoint sensitif menolak akses tidak sah secara default.
2. Semua route debug nonaktif di production dan tetap bisa dipakai terbatas di non-production oleh admin.
3. Aksi approval/rejection partner tidak bisa dipanggil hanya dengan `applicationId`.
4. Action moderation (`reports`) enforce admin check di level server action.
5. Dependensi Next.js naik ke patch aman (`16.1.6`) tanpa regressions build.
6. Log noise produksi berkurang signifikan dan tidak ada metadata sensitif yang ikut tercetak.

## Implementasi Bertahap

## Phase 0 - Preparation Baseline (0.5 hari)
1. Buat branch hardening khusus: `security-performance-hardening`.
2. Catat baseline sebelum perubahan: response code untuk endpoint kritikal, volume webhook log, jumlah request debug endpoint, dan build/lint status.
3. Siapkan daftar env baru di `.env.example` (hanya definisi, tanpa nilai sensitif).

## Phase 1 - Critical Security Hotfix (PR-1, prioritas tertinggi)
1. Lock down cron auto-cancel endpoint `src/app/api/cron/auto-cancel/route.ts`.
2. Implementasi auth cron: validasi header `Authorization: Bearer <CRON_SECRET>`.
3. Fail-closed di production jika `CRON_SECRET` tidak tersedia.
4. Kurangi response detail endpoint cron (jangan expose daftar ID booking yang dicancel).
5. Nonaktifkan route debug di production dengan guard server-side (return `notFound()`/403).
6. Tambahkan guard admin untuk akses debug di non-production.
7. Guard yang sama wajib diterapkan di `src/app/debug/actions.ts` agar server action tidak bisa dipanggil langsung tanpa hak.
8. Lock down endpoint internal `src/app/api/internal/test-rules/route.ts` dengan policy: production selalu `404`, non-production butuh token internal valid.
9. Perketat flow approval/rejection partner di `src/app/partner/actions.ts`: ubah signature action agar menerima `{ applicationId, reviewToken }` dan verifikasi keduanya sebelum mutation.
10. Update caller di `src/app/admin/review/[token]/page.tsx` agar selalu mengirim token saat approve/reject.
11. Enforce admin check eksplisit di `src/app/reports/actions.ts` untuk `getReports`, `resolveReport`, `getReportActions`.
12. Upgrade Next.js dari `16.1.4` ke `16.1.6`.
13. Hapus logging sensitif di `src/lib/smash-api.ts` (token prefix logging) dan log debug yang tidak wajib di jalur sensitif.

## Phase 2 - Abuse & Cost Protection (PR-2)
1. Tambahkan rate-limit untuk submit partner/coach di `src/app/partner/actions.ts` berbasis IP + email window.
2. Tambahkan CAPTCHA (server verification) untuk endpoint submit yang memicu email/insert DB eksternal.
3. Tambahkan anti-spam cooldown untuk action debug/non-core yang masih aktif di non-production.
4. Harden webhook logging policy di `src/app/api/webhooks/xendit/route.ts`: batasi payload logging, simpan fields penting saja, dan drop payload penuh untuk request invalid berulang.
5. Tambahkan retention policy `webhook_logs` (scheduled cleanup).
6. Validasi request body size limit pada endpoint publik dengan payload dinamis (booking/external APIs).

## Phase 3 - Performance & Operability Cleanup (PR-3)
1. Rapikan `console.log` noisy pada hot path client/server (chat realtime, bookings history, subscription hooks) dengan guard environment.
2. Standarkan structured logging (info/warn/error) agar observability tetap ada tanpa bloat.
3. Review query yang paling sering dipanggil untuk kebutuhan index tambahan minimal.
4. Tambahkan index bila belum ada: `bookings(status, created_at)`, `partner_applications(review_token)`, `webhook_logs(created_at)`.
5. Tambahkan smoke benchmark sederhana pasca-perubahan: latency endpoint payment status, webhook throughput, booking history render.

## Perubahan API/Interface/Type (Publik/Internal)

| Area | Perubahan |
|---|---|
| Env | Tambah `CRON_SECRET`, `INTERNAL_API_TOKEN`, `DEBUG_ACCESS_ENABLED` (default `false` di production) |
| Server Action | `approveApplication` dan `rejectApplication` berubah input jadi object `{ applicationId, reviewToken }` |
| Route Behavior | `/api/cron/auto-cancel` sekarang wajib bearer token |
| Route Behavior | `/api/internal/test-rules` production `404`, non-production token-gated |
| Route Behavior | `/debug` dan `/debug/xendit` nonaktif di production |
| Security Contract | `reports` server actions wajib admin auth check eksplisit |

## Test Cases dan Skenario Validasi

1. Cron unauthorized test: request tanpa bearer token ke `/api/cron/auto-cancel` harus `401/403`.
2. Cron authorized test: request dengan bearer valid sukses dan tidak expose detail sensitif.
3. Debug production gate test: `/debug` dan `/debug/xendit` harus tidak dapat diakses di production.
4. Debug action direct invoke test: panggilan langsung server action debug tanpa admin harus gagal.
5. Internal route test: `/api/internal/test-rules` harus `404` di production dan `401/403` tanpa token di non-production.
6. Partner approve/reject bypass test: panggilan dengan `applicationId` tanpa `reviewToken` valid harus ditolak.
7. Partner token flow regression: approve/reject dari review page tetap berjalan jika token valid.
8. Reports auth test: non-admin user tidak bisa baca/resolve report via server action.
9. Payment webhook regression: webhook valid tetap diproses normal.
10. Booking regression: create booking, payment check, booking history tetap jalan.
11. Build/lint/regression test: `npm run lint` dan `npm run build` harus pass setelah upgrade Next.js.
12. Basic load test: spam request ke endpoint sensitif tidak menyebabkan write amplification signifikan.

## Rollout, Deployment, dan Monitoring
1. Deploy PR-1 sendiri sebagai hotfix security.
2. Pantau 24 jam: unauthorized hits, error rate endpoint payment/webhook, false positive pada guard.
3. Deploy PR-2 setelah metrik stabil.
4. Deploy PR-3 terakhir sebagai operability/performance cleanup.
5. Siapkan rollback plan per PR dengan revert branch terpisah.

## Assumptions dan Default yang Dipilih
1. Rollout strategy dipilih: `Security First`.
2. Debug policy dipilih: `Prod Off + Dev/Admin`.
3. Admin source of truth tetap dari `isAdmin()` + role user saat ini.
4. Vercel cron akan mengirim bearer token yang sinkron dengan `CRON_SECRET`.
5. Tidak ada perubahan schema mayor yang memerlukan downtime; migration index dilakukan online.
6. Semua perubahan dirilis bertahap untuk meminimalkan blast radius.
