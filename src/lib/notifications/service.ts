import { logger } from '@/lib/logger'
import { createServiceClient } from '@/lib/supabase/server'

export type NotificationEventType =
    | 'booking_confirmed'
    | 'booking_cancelled'
    | 'payment_reminder'
    | 'points_earned'
    | 'system'
    | 'promo'

type NotificationMetadata = Record<string, string | number | boolean | null | undefined>

interface CreateNotificationInput {
    userId: string
    type: NotificationEventType
    title: string
    message: string
    metadata?: NotificationMetadata
    supabase?: ReturnType<typeof createServiceClient>
}

interface BookingNotificationPayload {
    id: string
    user_id: string
    booking_date?: string | null
    start_time?: string | null
    venue_name?: string | null
    court_name?: string | null
}

interface CreateBookingEventNotificationInput {
    type: 'booking_confirmed' | 'booking_cancelled' | 'payment_reminder'
    booking: BookingNotificationPayload
    supabase?: ReturnType<typeof createServiceClient>
}

const formatScheduleLabel = (bookingDate?: string | null, startTime?: string | null) => {
    if (!bookingDate) return null
    if (!startTime) return bookingDate
    return `${bookingDate} ${startTime.slice(0, 5)}`
}

const bookingNotificationExists = async ({
    userId,
    type,
    bookingId,
    supabase
}: {
    userId: string
    type: CreateBookingEventNotificationInput['type']
    bookingId: string
    supabase: ReturnType<typeof createServiceClient>
}) => {
    const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', type)
        .contains('metadata', { booking_id: bookingId })
        .limit(1)

    if (error) {
        logger.error({ error, userId, type, bookingId }, 'Failed checking existing booking notification')
        return false
    }

    return Boolean(data && data.length > 0)
}

const buildBookingNotificationMessage = (type: CreateBookingEventNotificationInput['type'], booking: BookingNotificationPayload) => {
    const venueLabel = booking.venue_name || 'venue pilihanmu'
    const courtLabel = booking.court_name || 'lapangan pilihanmu'
    const scheduleLabel = formatScheduleLabel(booking.booking_date, booking.start_time)

    switch (type) {
        case 'booking_confirmed':
            return {
                title: 'Booking Dikonfirmasi',
                message: scheduleLabel
                    ? `Booking ${courtLabel} di ${venueLabel} untuk ${scheduleLabel} sudah dikonfirmasi.`
                    : `Booking ${courtLabel} di ${venueLabel} sudah dikonfirmasi.`
            }
        case 'booking_cancelled':
            return {
                title: 'Booking Dibatalkan',
                message: scheduleLabel
                    ? `Booking ${courtLabel} di ${venueLabel} untuk ${scheduleLabel} dibatalkan.`
                    : `Booking ${courtLabel} di ${venueLabel} dibatalkan.`
            }
        case 'payment_reminder':
        default:
            return {
                title: 'Pengingat Pembayaran',
                message: scheduleLabel
                    ? `Segera selesaikan pembayaran booking ${courtLabel} di ${venueLabel} (${scheduleLabel}) agar tidak dibatalkan otomatis.`
                    : `Segera selesaikan pembayaran booking ${courtLabel} di ${venueLabel} agar tidak dibatalkan otomatis.`
            }
    }
}

export async function createNotification({
    userId,
    type,
    title,
    message,
    metadata,
    supabase
}: CreateNotificationInput): Promise<{ success: boolean; error?: string }> {
    const supabaseClient = supabase ?? createServiceClient()

    const { error } = await supabaseClient
        .from('notifications')
        .insert({
            user_id: userId,
            type,
            title,
            message,
            metadata: metadata ?? {}
        })

    if (error) {
        logger.error({ error, userId, type }, 'Failed creating notification')
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function createBookingEventNotification({
    type,
    booking,
    supabase
}: CreateBookingEventNotificationInput): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
    const supabaseClient = supabase ?? createServiceClient()

    const exists = await bookingNotificationExists({
        userId: booking.user_id,
        type,
        bookingId: booking.id,
        supabase: supabaseClient
    })

    if (exists) {
        return { success: true, skipped: true }
    }

    const { title, message } = buildBookingNotificationMessage(type, booking)
    return createNotification({
        userId: booking.user_id,
        type,
        title,
        message,
        metadata: {
            booking_id: booking.id,
            booking_date: booking.booking_date ?? undefined,
            court_name: booking.court_name ?? undefined,
            venue_name: booking.venue_name ?? undefined,
            notification_source: 'booking_event'
        },
        supabase: supabaseClient
    })
}
