# 📋 Permintaan API Endpoint: Notifications System

> **Dari**: Badminton Court Booking System (Frontend)  
> **Untuk**: PWA Smash API Team  
> **Tanggal**: 4 Februari 2026  
> **Prioritas**: Medium

---

## 🎯 Tujuan

Mengaktifkan fitur **notifikasi in-app** untuk user di Booking System. Saat ini halaman notifikasi sudah siap dengan UI dan logic, tetapi menunggu API endpoint dari PWA Smash.

---

## 📦 Endpoint yang Diperlukan

### 1. GET `/users/:userId/notifications`

Mengambil daftar notifikasi untuk user tertentu.

**Request:**
```http
GET /api/v1/users/{userId}/notifications
Authorization: Bearer <token>
```

**Query Params (Optional):**
- `limit` - Jumlah notifikasi per halaman (default: 20)
- `offset` - Offset untuk pagination
- `unread_only` - Filter hanya yang belum dibaca (boolean)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "notif_uuid_1",
      "user_id": "user_uuid",
      "type": "booking_confirmed",
      "title": "Booking Dikonfirmasi",
      "message": "Booking Anda untuk Lapangan 1 pada 15 Feb telah dikonfirmasi.",
      "read": false,
      "created_at": "2026-02-04T10:30:00Z",
      "metadata": {
        "booking_id": "booking_uuid",
        "court_name": "Lapangan 1",
        "booking_date": "2026-02-15"
      }
    }
  ],
  "total": 15,
  "unread_count": 3
}
```

---

### 2. PATCH `/notifications/:notificationId/read`

Menandai notifikasi sebagai sudah dibaca.

**Request:**
```http
PATCH /api/v1/notifications/{notificationId}/read
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

### 3. PATCH `/users/:userId/notifications/read-all`

Menandai semua notifikasi user sebagai sudah dibaca.

**Request:**
```http
PATCH /api/v1/users/{userId}/notifications/read-all
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "updated_count": 5
}
```

---

## 📊 Notification Types

Frontend sudah siap menangani tipe notifikasi berikut:

| Type | Icon | Color | Contoh Penggunaan |
|------|------|-------|-------------------|
| `booking_confirmed` | 📅 Calendar | Green | Booking berhasil dikonfirmasi |
| `booking_cancelled` | ⚠️ Warning | Yellow | Booking dibatalkan |
| `payment_reminder` | 💳 Credit Card | Yellow | Pengingat pembayaran |
| `points_earned` | ✓ Check | Green | User mendapat poin |
| `promo` | 🎁 Gift | Purple | Promo atau diskon |
| `system` | ℹ️ Info | Gray | Pengumuman sistem |

---

## 🗃️ Database Schema (Saran)

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
```

---

## 🔔 Kapan Mengirim Notifikasi

Berikut trigger yang disarankan untuk membuat notifikasi:

| Event | Type | Contoh Title |
|-------|------|--------------|
| Booking confirmed by partner | `booking_confirmed` | "Booking Dikonfirmasi" |
| Booking cancelled | `booking_cancelled` | "Booking Dibatalkan" |
| Payment deadline approaching | `payment_reminder` | "Pengingat Pembayaran" |
| Points credited after booking | `points_earned` | "Poin Diperoleh" |
| System maintenance | `system` | "Maintenance Terjadwal" |

---

## ✅ Status Frontend

- [x] UI halaman notifikasi
- [x] Loading state
- [x] Empty state (jika tidak ada notifikasi)
- [x] Mark as read (single)
- [x] Mark all as read
- [x] Relative time formatting ("2 jam lalu", "1 hari lalu")
- [x] Type-based icons dan colors
- [ ] ⏳ Menunggu API dari PWA Smash

---

**Status**: ⏳ Menunggu implementasi endpoint dari PWA Smash API Team
