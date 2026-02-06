# Logging Implementation Plan

> Implementasi Structured Logging dengan Pino & Wide Events Pattern

## Objective

Mengimplementasikan standar logging yang konsisten dan terstruktur di seluruh aplikasi badminton-booking-system, menggantikan penggunaan `console.log` dengan **Pino** untuk structured JSON logging.

---

## Proposed Changes

### 1. Dependencies Setup

**Install required packages:**
```bash
npm install pino pino-pretty
```

---

### 2. Logger Configuration

#### [NEW] [logger.ts](file:///c:/Users/user/badminton-booking-system/src/lib/logger.ts)

Membuat konfigurasi logger Pino dengan format yang berbeda untuk development dan production:

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
    }
  } : undefined,
  base: {
    env: process.env.NODE_ENV,
  },
});
```

---

### 3. Server Action Wrapper

#### [NEW] [safe-action.ts](file:///c:/Users/user/badminton-booking-system/src/lib/safe-action.ts)

Higher-Order Function untuk membungkus Server Actions dengan "Wide Event" logging pattern:

**Features:**
- Otomatis mencatat durasi eksekusi
- Mencatat status success/error
- Single log line per action (Wide Event pattern)
- Error stack trace capture

---

### 4. Refactor Existing Server Actions

Mengidentifikasi dan refactor semua Server Actions yang menggunakan `console.log` atau `console.error`:

| File | Status | Priority |
|------|--------|----------|
| `src/app/admin/**/actions.ts` | To be audited | High |
| `src/app/api/**/route.ts` | To be audited | High |
| `src/lib/**/*.ts` | To be audited | Medium |

**Pattern transformasi:**

```diff
- export async function deleteUser(userId: string) {
-   console.log("Deleting user", userId);
-   // ...
- }

+ import { withLogging } from '@/lib/safe-action';
+ 
+ const deleteUserLogic = async (userId: string) => {
+   // ... logic tanpa console.log
+ };
+ 
+ export const deleteUser = withLogging('deleteUser', deleteUserLogic);
```

---

## Verification Plan

### Automated Tests
```bash
# Build check
npm run build

# Type check
npx tsc --noEmit
```

### Manual Verification
1. Jalankan aplikasi di mode development: `npm run dev`
2. Trigger beberapa server actions
3. Verifikasi output log di terminal menggunakan format pino-pretty
4. Pastikan tidak ada `console.log` yang tersisa (gunakan grep search)

---

## Implementation Checklist

- [x] Install `pino` dan `pino-pretty` dependencies
- [x] Buat `src/lib/logger.ts` (server-side only)
- [x] Buat `src/lib/safe-action.ts` wrapper dengan headers extraction
- [ ] Audit file-file yang menggunakan `console.log`
- [x] Refactor Server Actions menggunakan `withLogging` wrapper
    - [x] `src/app/admin/review/actions.ts` (`getApplicationByToken`)
    - [x] `src/app/admin/(dashboard)/bookings/actions.ts` (`getAllBookings`)
- [x] Refactor API Routes menggunakan `logger` directly
    - [x] `src/app/api/webhooks/xendit/route.ts`
    - [x] `src/app/api/external/v1/courts/route.ts`
    - [x] `src/app/api/external/v1/bookings/[id]/payment/route.ts`
    - [x] `src/app/api/external/v1/bookings/route.ts`
    - [x] `src/app/api/cron/auto-cancel/route.ts`
    - [x] Removed/Commented console logs in `src/app/admin/review/[token]/page.tsx`
- [ ] Tambahkan `LOG_LEVEL` ke `.env.example`
- [ ] Verifikasi logging di development mode
- [x] Pastikan sensitive data (password, token) tidak di-log (built-in sanitization)

---

## Sensitive Data Rules

> [!CAUTION]
> **Jangan pernah log data sensitif berikut:**
> - Passwords
> - API tokens/keys
> - Personal Identifiable Information (PII)

Jika input mengandung field sensitif, filter terlebih dahulu sebelum passing ke `withLogging`.

---

## Timeline

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Setup dependencies & base files | 30 menit |
| 2 | Audit existing console.log usage | 1 jam |
| 3 | Refactor Server Actions | 2-3 jam |
| 4 | Testing & verification | 1 jam |

---

## Notes

- File ini dibuat berdasarkan [logging-standard.md](file:///c:/Users/user/badminton-booking-system/supabase/logging-standard.md)
- Pattern ini memudahkan integrasi dengan log aggregator seperti **Axiom** di masa depan
