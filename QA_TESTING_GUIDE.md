# QA Testing Guide: Badminton Booking System

Based on the database schema analysis, this guide outlines the critical test scenarios required to ensure optimal system performance and data integrity.

> **Role Legend:**
> - 👤 **User**: Authenticated Customer
> - 🛡️ **Admin**: Authenticated Admin `(role='admin')`
> - 🌐 **Public**: Unauthenticated Visitor

---

## 1. Authentication & User Management (Table: `public.users`)

The `users` table is the backbone of the system, synchronized with Supabase Auth.

- [x] **Sign Up Flow (Trigger Test)**
    -   **Action:** dynamic Register a new user via the UI.
    -   **Expected:** A new row is automatically created in `public.users` matching the `auth.users` ID. Matches default role 'customer'.
- [x] **Profile Access (RLS)**
    -   **Action:** User A attempts to view User B's profile data (e.g., via API or forged request).
    -   **Expected:** **Access Denied**. RLS policy "Users can view their own profile" should prevent this.
- [x] **Profile Update**
    -   **Action:** User updates their `full_name` or `phone`.
    -   **Expected:** `updated_at` timestamp refreshes. Changes persist.
- [x] **Admin Access**
    -   **Action:** Admin user requests list of all users.
    -   **Expected:** **Access Granted**. RLS policy "Admins can view all users" allows this.

## 2. Venues & Courts (Table: `public.courts`)

Manage the physical assets.

- [x] **Court Creation (Admin Only)**
    -   **Action:** Admin creates a new court with `is_active = true`.
    -   **Expected:** Court appears in public listings.
- [x] **Court Visibility**
    -   **Action:** Admin sets a court to `is_active = false`.
    -   **Expected:** Public users **cannot** see this court in booking options. Admin **can** still see it.
- [x] **Unauthorized Creation**
    -   **Action:** Standard User attempts to create a court via API.
    -   **Expected:** **Access Denied**. RLS policy "Admins can insert courts" blocks this.

## 3. Booking Logic (Table: `public.bookings`)

This is the most critical logic with strict constraints to prevent conflicts.

- [x] **Standard Booking**
    -   **Action:** User books Court A for a specific date/time.
    -   **Expected:** Booking status defaults to 'pending'. Row created in DB.
- [x] **Overlap Prevention (Critical)**
    -   **Action:** User A books Court 1, 10:00-11:00. User B attempts to book Court 1, 10:30-11:30 (or same slot).
    -   **Expected:** **Database Error / Constraint Violation**. The exclusion constraint `no_overlapping_bookings` MUST fail the transaction.
- [x] **Double Booking Guard**
    -   **Action:** User attempts to submit the exact same booking request twice rapidly (race condition simulation).
    -   **Expected:** `unique_booking` constraint prevents duplicate entry.
- [x] **Cancellation Policy**
    -   **Action:** User cancels a 'pending' booking.
    -   **Expected:** Row deleted (or status changed to cancelled if soft-delete implemented, currently RLS allows DELETE).
    -   **Action:** User attempts to cancel a 'confirmed' booking (if UI allows).
    -   **Expected:** Check if RLS allows this. Current RLS: `status = 'pending'` for user deletes. Confirmed bookings might require Admin intervention or specific logic.
- [x] **Admin Override**
    -   **Action:** Admin deletes/modifies any user's booking.
    -   **Expected:** **Success**. Admin policies allow full control.

## 4. Operational Settings & Pricing (Tables: `operational_hours`, `pricing`, `settings`)

- [x] **Opening Hours enforcement**
    -   **Action:** Configure generic hours 08:00 - 22:00.
    -   **Test:** Attempt to book a slot at 07:00 or 23:00.
    -   **Expected:** UI/API should validate against `operational_hours` table before inserting.
- [x] **Pricing Logic**
    -   **Action:** Create booking on a Weekday vs. Weekend.
    -   **Expected:** `total_price` should calculate based on the `pricing` table rates correctly.
    -   **Test:** Override price for a specific Court ID and verify it takes precedence over default (NULL court_id) price.
- [x] **JSON Settings**
    -   **Action:** Admin updates a global setting (e.g., site banner).
    -   **Expected:** `value` (JSONB) updates correctly.

## 5. Partner Applications (Table: `partner_applications`)

- [x] **Public Submission**
    -   **Action:** Unauthenticated user submits partner form.
    -   **Expected:** Row created with status 'pending'.
- [x] **Admin Review**
    -   **Action:** Admin updates status to 'approved'.
    -   **Expected:** Status updates. `updated_at` refreshes.
- [x] **Guest Privacy**
    -   **Action:** Public user tries to list all applications.
    -   **Expected:** **Access Denied**. RLS allows only INSERT for public, SELECT for Admin.

## 6. Edge Cases & Stress Testing

- [x] **TimeZone Handling**
    -   **Scenario:** Database stores in UTC/Timezone aware. Ensure 10:00 AM user time = 10:00 AM server time logic is consistent.
- [x] **Rate Limiting**
    -   **Scenario:** Spam booking requests.
    -   **Check:** Verify application-level rate limits (e.g., Upstash) are active.
- [x] **Data Types**
    -   Verify `decimal(10,2)` handles currency correctly without rounding errors.

---

### Progress Tracking
_Mark items as completed using `[x]` as you test._
