'use server'

import { getCourts } from './courts'
import { revalidatePath } from 'next/cache'
import { smashApi, SmashVenueDetails, SmashAvailabilityResponse } from '@/lib/smash-api'
import { getCurrentUser } from '@/lib/auth/actions'
import { getSetting } from '@/lib/api/settings'
import { createClient } from '@/lib/supabase/server'
import { createBookingEventNotification } from '@/lib/notifications/service'
import { createPaymentRequestForOrder, getOrderPaymentStatus } from '@/lib/payments/service'
import { validateBookingTime } from '@/lib/date-utils'




/**
 * Server action to fetch courts (Local DB)
 * @deprecated Use fetchVenues for external API
 */
export async function fetchCourts() {
    const courts = await getCourts({ isActive: true })
    return courts
}

/**
 * Server action to fetch venues from Smash API
 */
export async function fetchVenues() {
    const venues = await smashApi.getVenues()
    return venues
}

/**
 * Server action to fetch public courts (with venue details)
 * Use for dynamic filtering
 */
export async function fetchPublicCourts() {
    const courts = await smashApi.getPublicCourts()
    return courts
}

/**
 * Server action to fetch venue details (with courts) from Smash API
 * Use this when user selects a venue to get court list
 */
export async function fetchVenueDetails(venueId: string): Promise<SmashVenueDetails | null> {
    return await smashApi.getVenueDetails(venueId)
}

/**
 * Server action to fetch courts for a venue from Smash API
 * Use this to get courts with court_type and photo_url
 * Endpoint: GET /venues/{id}/courts
 */
export async function fetchVenueCourts(venueId: string) {
    return await smashApi.getVenueCourts(venueId)
}

/**
 * Server action to fetch availability for a venue on specific date
 * Returns complete slot availability per court
 */
export async function fetchAvailableSlots(venueId: string, date: string): Promise<SmashAvailabilityResponse | null> {
    return await smashApi.checkAvailability(venueId, date)
}

/**
 * Server action to create a booking
 * Dual-Write: Smash API (Master) -> Supabase (Replica/History)
 */
export async function createBooking(data: {
    courtId: string // Venue ID
    courtUuid: string // Specific Court UUID
    bookingDate: string
    startTime: string
    endTime: string
    durationHours: number
    notes?: string
    venueName?: string
    courtName?: string
}) {
    const user = await getCurrentUser()

    if (!user) {
        return { success: false, error: 'Unauthorized: Harap login terlebih dahulu untuk melakukan booking.' }
    }

    const smashBooking = {
        venue_id: data.courtId,
        court_id: data.courtUuid,
        booking_date: data.bookingDate,
        start_time: data.startTime,
        duration: data.durationHours,
        customer_name: user.name,
        phone: user.phone || ''
    }

    const apiResult = await smashApi.createBooking(smashBooking)

    if (apiResult.error || !apiResult.data?.id) {
        return { success: false, error: apiResult.error || 'Failed to create booking' }
    }

    const bookingId = apiResult.data.id
    const venueDetails = await smashApi.getVenueDetails(data.courtId)
    const selectedCourt = venueDetails?.courts.find((court) => court.id === data.courtUuid)
    const hourlyRate = selectedCourt?.hourly_rate || 50000
    const originalPrice = hourlyRate * data.durationHours

    // VALIDATION: Prevent Past Bookings (Timezone Aware)
    // We need venue timezone. Ideally it should be in venueDetails.
    // Since it's not yet in the interface, we default to Asia/Jakarta or fetch it if available.
    // Assuming venueDetails might have it in future or we use a default for specific regions.
    // For now, let's assume default 'Asia/Jakarta' if not found.
    // TODO: Add timezone to SmashVenue interface if needed.
    const venueTimezone = (venueDetails as any)?.timezone || 'Asia/Jakarta';

    const timeValidation = validateBookingTime(data.bookingDate, data.startTime, venueTimezone);

    if (!timeValidation.isValid) {
        return { success: false, error: timeValidation.error || 'Invalid booking time' };
    }

    const serviceFeeUser = await getSetting('service_fee_user', 3000)


    const applicationFeePartner = await getSetting('application_fee_partner', 2000)

    const netVenuePrice = originalPrice - applicationFeePartner
    const totalUserBill = originalPrice + serviceFeeUser

    const useXenditV3 = process.env.FEATURE_XENDIT_V3_PAYMENTS !== 'false'
    const defaultChannelCode = process.env.XENDIT_DEFAULT_CHANNEL_CODE || 'QRIS'

    try {
        const { createServiceClient } = await import('@/lib/supabase/server')
        const supabase = createServiceClient()

        const { data: existingCourt } = await supabase
            .from('courts')
            .select('id')
            .eq('id', data.courtUuid)
            .single()

        if (!existingCourt) {
            const courtDetails = venueDetails?.courts.find((court) => court.id === data.courtUuid)
            const { error: courtInsertError } = await supabase.from('courts').insert({
                id: data.courtUuid,
                name: courtDetails?.name || 'Court',
                description: `${venueDetails?.name || 'Venue'} - Synced from PWA`,
                is_active: true
            })

            if (courtInsertError) {
                console.error('Failed to sync court to local DB:', courtInsertError)
            }
        }

        const { data: existingBooking } = await supabase
            .from('bookings')
            .select('id, user_id, status')
            .eq('court_id', data.courtUuid)
            .eq('booking_date', data.bookingDate)
            .eq('start_time', data.startTime)
            .single()

        if (existingBooking && existingBooking.status === 'pending') {
            await supabase.from('bookings').delete().eq('id', existingBooking.id)
        }

        const { error: bookingInsertError } = await supabase.from('bookings').insert({
            id: bookingId,
            user_id: user.id,
            court_id: data.courtUuid,
            booking_date: data.bookingDate,
            start_time: data.startTime,
            end_time: data.endTime,
            total_price: totalUserBill,
            status: 'pending',
            duration_hours: data.durationHours,
            venue_id: data.courtId,
            venue_name: data.venueName || venueDetails?.name || 'Unknown Venue',
            court_name: data.courtName || selectedCourt?.name || 'Unknown Court',
            payment_url: null,
            payment_method: defaultChannelCode,
            payment_state: 'PENDING_USER_ACTION',
            application_fee: applicationFeePartner,
            xendit_fee: 0,
            service_fee: serviceFeeUser,
            net_venue_price: netVenuePrice
        })

        if (bookingInsertError) {
            console.error('Failed to save booking to local DB:', bookingInsertError)
            return {
                success: true,
                data: apiResult.data,
                warning: `Booking dibuat di partner API, tapi gagal sinkron ke local DB: ${bookingInsertError.message}`
            }
        }

        await createBookingEventNotification({
            type: 'payment_reminder',
            booking: {
                id: bookingId,
                user_id: user.id,
                booking_date: data.bookingDate,
                start_time: data.startTime,
                venue_name: data.venueName || venueDetails?.name || null,
                court_name: data.courtName || selectedCourt?.name || null
            },
            supabase
        })

        let paymentWarning: string | undefined
        let paymentUrl: string | undefined
        let payment:
            | {
                paymentRequestId: string
                referenceId: string
                status: string
                actions: Array<{ type: string; descriptor: string | null; value: string }>
                expiresAt: string | null
            }
            | undefined

        if (useXenditV3) {
            try {
                const initiatedPayment = await createPaymentRequestForOrder({
                    orderId: bookingId,
                    amount: totalUserBill,
                    channelCode: defaultChannelCode,
                    description: `Booking ${venueDetails?.name || 'Court'} - ${selectedCourt?.name || 'Badminton'}`,
                    metadata: {
                        customer_email: user.email
                    }
                })

                payment = {
                    paymentRequestId: initiatedPayment.paymentRequestId,
                    referenceId: initiatedPayment.referenceId,
                    status: initiatedPayment.status,
                    actions: initiatedPayment.actions,
                    expiresAt: initiatedPayment.expiresAt
                }

                const redirectAction = initiatedPayment.actions.find((action) => action.type === 'REDIRECT_CUSTOMER')
                if (redirectAction?.value) {
                    paymentUrl = redirectAction.value
                }
            } catch (paymentError) {
                const errorMessage = paymentError instanceof Error ? paymentError.message : 'Unknown error'
                paymentWarning = `Payment request gagal dibuat: ${errorMessage}. Booking tetap tersimpan sebagai pending.`
            }
        } else {
            paymentWarning = 'Feature flag Xendit v3 nonaktif. Payment request belum dibuat.'
        }

        if (apiResult.success) {
            revalidatePath('/')
        }

        return {
            success: true,
            data: apiResult.data,
            paymentUrl,
            payment,
            warning: paymentWarning
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Failed to create payment request:', error)
        return {
            success: true,
            data: apiResult.data,
            warning: `Payment link failed: ${errorMessage}. Booking saved as Pending.`
        }
    }
}

export async function confirmBookingPayment(bookingId: string) {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    try {
        const paymentStatus = await getOrderPaymentStatus(bookingId, { syncFromProvider: true })

        revalidatePath('/bookings/history')

        if (paymentStatus.orderStatus === 'confirmed') {
            return { success: true, status: 'confirmed', payment: paymentStatus }
        }

        if (paymentStatus.orderStatus === 'cancelled') {
            return { success: true, status: 'cancelled', payment: paymentStatus }
        }

        return {
            success: false,
            status: paymentStatus.providerStatus || paymentStatus.paymentStatus || 'pending',
            payment: paymentStatus
        }
    } catch (e: unknown) {
        console.error('Manual payment check failed', e)
        const message = e instanceof Error ? e.message : 'Check failed'
        return { success: false, error: message }
    }
}

export async function updateBookingStatus(bookingId: string, status: string, paidAmount?: number) {
    return await smashApi.updateBookingStatus(bookingId, status, paidAmount)
}

// ============== NOTIFICATIONS ==============

export type NotificationType = 'booking_confirmed' | 'booking_cancelled' | 'payment_reminder' | 'points_earned' | 'system' | 'promo'

export interface Notification {
    id: string
    user_id: string
    type: NotificationType
    title: string
    message: string
    read: boolean
    created_at: string
    // Optional metadata for different notification types
    metadata?: {
        booking_id?: string
        court_name?: string
        booking_date?: string
        venue_name?: string
        points?: number
        promo_code?: string
        notification_source?: string
        [key: string]: string | number | boolean | null | undefined
    }
}

export interface NotificationPreferences {
    accountEmail: boolean
    accountPush: boolean
    exclusiveEmail: boolean
    exclusivePush: boolean
    reminderEmail: boolean
    reminderPush: boolean
}

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
    accountEmail: true,
    accountPush: false,
    exclusiveEmail: true,
    exclusivePush: false,
    reminderEmail: true,
    reminderPush: false,
}

const mapPreferenceDbToClient = (row: {
    account_email: boolean
    account_push: boolean
    exclusive_email: boolean
    exclusive_push: boolean
    reminder_email: boolean
    reminder_push: boolean
}): NotificationPreferences => ({
    accountEmail: row.account_email,
    accountPush: row.account_push,
    exclusiveEmail: row.exclusive_email,
    exclusivePush: row.exclusive_push,
    reminderEmail: row.reminder_email,
    reminderPush: row.reminder_push
})

const mapPreferenceClientToDb = (preferences: NotificationPreferences) => ({
    account_email: preferences.accountEmail,
    account_push: preferences.accountPush,
    exclusive_email: preferences.exclusiveEmail,
    exclusive_push: preferences.exclusivePush,
    reminder_email: preferences.reminderEmail,
    reminder_push: preferences.reminderPush
})

/**
 * Server action to fetch user notifications
 */
export async function fetchNotifications(): Promise<Notification[]> {
    const user = await getCurrentUser()

    if (!user) {
        return []
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, type, title, message, metadata, read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Failed to fetch notifications:', error)
        return []
    }

    return (data || []) as Notification[]
}

/**
 * Server action to mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
    const user = await getCurrentUser()

    if (!user) {
        return { success: false }
    }

    const supabase = await createClient()
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Failed to mark notification as read:', error)
        return { success: false }
    }

    revalidatePath('/notifications')
    return { success: true }
}

/**
 * Server action to mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
    const user = await getCurrentUser()

    if (!user) {
        return { success: false }
    }

    const supabase = await createClient()
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

    if (error) {
        console.error('Failed to mark all notifications as read:', error)
        return { success: false }
    }

    revalidatePath('/notifications')
    return { success: true }
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
    const user = await getCurrentUser()

    if (!user) {
        return DEFAULT_NOTIFICATION_PREFERENCES
    }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('notification_preferences')
        .select('account_email, account_push, exclusive_email, exclusive_push, reminder_email, reminder_push')
        .eq('user_id', user.id)
        .maybeSingle()

    if (error) {
        console.error('Failed to load notification preferences:', error)
        return DEFAULT_NOTIFICATION_PREFERENCES
    }

    if (!data) {
        const { error: upsertError } = await supabase
            .from('notification_preferences')
            .upsert(
                {
                    user_id: user.id,
                    ...mapPreferenceClientToDb(DEFAULT_NOTIFICATION_PREFERENCES)
                },
                { onConflict: 'user_id' }
            )

        if (upsertError) {
            console.error('Failed to initialize notification preferences:', upsertError)
        }

        return DEFAULT_NOTIFICATION_PREFERENCES
    }

    return mapPreferenceDbToClient(data)
}

export async function updateNotificationPreferences(
    partialPreferences: Partial<NotificationPreferences>
): Promise<{ success: boolean; preferences?: NotificationPreferences; error?: string }> {
    const user = await getCurrentUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    const currentPreferences = await getNotificationPreferences()
    const nextPreferences: NotificationPreferences = {
        ...currentPreferences,
        ...partialPreferences
    }

    const supabase = await createClient()
    const { error } = await supabase
        .from('notification_preferences')
        .upsert(
            {
                user_id: user.id,
                ...mapPreferenceClientToDb(nextPreferences)
            },
            { onConflict: 'user_id' }
        )

    if (error) {
        console.error('Failed to update notification preferences:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/settings/notifications')
    return { success: true, preferences: nextPreferences }
}

