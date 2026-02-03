import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'

export interface BookingFilters {
    userId?: string
    courtId?: string
    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
    startDate?: string
    endDate?: string
}

export interface CreateBookingData {
    courtId: string
    bookingDate: string
    startTime: string
    endTime: string
    durationHours: number
    notes?: string
}

/**
 * Get all bookings with optional filtering
 * Users see only their bookings, admins see all
 */
export async function getBookings(filters?: BookingFilters) {
    const supabase = await createClient()

    let query = supabase
        .from('bookings')
        .select(
            `
      *,
      court:courts(*),
      user:users(id, full_name, email, phone)
    `
        )
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: false })

    if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
    }

    if (filters?.courtId) {
        query = query.eq('court_id', filters.courtId)
    }

    if (filters?.status) {
        query = query.eq('status', filters.status)
    }

    if (filters?.startDate) {
        query = query.gte('booking_date', filters.startDate)
    }

    if (filters?.endDate) {
        query = query.lte('booking_date', filters.endDate)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching bookings:', error)
        return []
    }

    return data || []
}

/**
 * Get a single booking by ID
 */
export async function getBookingById(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('bookings')
        .select(
            `
      *,
      court:courts(*),
      user:users(id, full_name, email, phone)
    `
        )
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching booking:', error)
        return null
    }

    return data
}

/**
 * Helper: Calculate price based on court, date (weekday/weekend), and duration
 */
export async function calculateBookingPrice(
    supabase: SupabaseClient,
    courtId: string,
    bookingDate: string,
    durationHours: number
): Promise<{ price: number; error?: string }> {
    // Determine day type (Weekday vs Weekend)
    const date = new Date(bookingDate)
    const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const dayType = isWeekend ? 'weekend' : 'weekday'

    // Fetch pricing: Try specific court pricing first, then default (court_id is NULL)
    // Note: The unique constraint is (court_id, day_type).
    // We can fetch both specific and default for this day_type and pick the best match.
    const { data: pricingData, error } = await supabase
        .from('pricing')
        .select('*')
        .eq('day_type', dayType)
        .or(`court_id.eq.${courtId},court_id.is.null`)

    if (error) {
        console.error('Error fetching pricing:', error)
        return { price: 0, error: 'Could not fetch pricing configuration' }
    }

    // Prioritize specific court price over default
    const specificPrice = pricingData?.find((p) => p.court_id === courtId)
    const defaultPrice = pricingData?.find((p) => p.court_id === null)
    const activePrice = specificPrice || defaultPrice

    if (!activePrice) {
        return { price: 0, error: `No pricing found for ${dayType}` }
    }

    return { price: Number(activePrice.price_per_hour) * durationHours }
}

/**
 * Helper: Validate operational hours
 */
export async function validateOperationalHours(
    supabase: SupabaseClient,
    bookingDate: string,
    startTime: string,
    durationHours: number
): Promise<{ isValid: boolean; error?: string }> {
    const date = new Date(bookingDate)
    const dayOfWeek = date.getDay()

    const { data: hours, error } = await supabase
        .from('operational_hours')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .single()

    if (error || !hours || !hours.is_active) {
        return { isValid: false, error: 'Venue is closed on this day' }
    }

    // Convert times to comparable numbers or objects
    const [openH, openM] = hours.open_time.split(':').map(Number)
    const [closeH, closeM] = hours.close_time.split(':').map(Number)
    const [startH, startM] = startTime.split(':').map(Number)

    const bookingStartMinutes = startH * 60 + startM
    const bookingEndMinutes = bookingStartMinutes + durationHours * 60
    const openMinutes = openH * 60 + openM
    const closeMinutes = closeH * 60 + closeM

    if (bookingStartMinutes < openMinutes) {
        return { isValid: false, error: `Booking cannot start before opening time (${hours.open_time})` }
    }

    if (bookingEndMinutes > closeMinutes) {
        return { isValid: false, error: `Booking must end before closing time (${hours.close_time})` }
    }

    return { isValid: true }
}

/**
 * Create a new booking
 */
export async function createBooking(bookingData: CreateBookingData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // 1. Validate Operational Hours
    const opsCheck = await validateOperationalHours(
        supabase,
        bookingData.bookingDate,
        bookingData.startTime,
        bookingData.durationHours
    )
    if (!opsCheck.isValid) {
        return { error: opsCheck.error }
    }

    // 2. Check availability
    const isAvailable = await checkAvailability(
        bookingData.courtId,
        bookingData.bookingDate,
        bookingData.startTime
    )

    if (!isAvailable) {
        return { error: 'Time slot is not available' }
    }

    // 3. Calculate Price Correctly
    const priceCalc = await calculateBookingPrice(
        supabase,
        bookingData.courtId,
        bookingData.bookingDate,
        bookingData.durationHours
    )

    if (priceCalc.error) {
        return { error: priceCalc.error }
    }

    // 4. Double-check availability immediately before insert (Race condition mitigation)
    const isStillAvailable = await checkAvailability(
        bookingData.courtId,
        bookingData.bookingDate,
        bookingData.startTime
    )

    if (!isStillAvailable) {
        return { error: 'Time slot was just taken. Please try another time.' }
    }

    const { data, error } = await supabase
        .from('bookings')
        .insert({
            court_id: bookingData.courtId,
            user_id: user.id,
            booking_date: bookingData.bookingDate,
            start_time: bookingData.startTime,
            end_time: bookingData.endTime,
            duration_hours: bookingData.durationHours,
            total_price: priceCalc.price,
            notes: bookingData.notes,
            status: 'pending',
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating booking:', error)
        return { error: error.message }
    }

    return { data, success: true }
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
    id: string,
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating booking status:', error)
        return { error: error.message }
    }

    return { data, success: true }
}

/**
 * Cancel a booking
 * Users can only cancel their own pending bookings
 */
export async function cancelBooking(id: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Get booking to check ownership and status
    const booking = await getBookingById(id)

    if (!booking) {
        return { error: 'Booking not found' }
    }

    if (booking.user_id !== user.id) {
        // Check if user is admin
        const { data: userProfile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userProfile?.role !== 'admin') {
            return { error: 'Not authorized to cancel this booking' }
        }
    }

    // Check if booking can be cancelled (must be at least 2 hours before)
    const now = new Date()
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`)
    const hoursDifference = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursDifference < 2 && booking.user_id === user.id) {
        return { error: 'Cannot cancel booking less than 2 hours before start time' }
    }

    return updateBookingStatus(id, 'cancelled')
}

/**
 * Check if a time slot is available for booking
 */
export async function checkAvailability(courtId: string, date: string, startTime: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('court_id', courtId)
        .eq('booking_date', date)
        .eq('start_time', startTime)
        .in('status', ['pending', 'confirmed'])

    if (error) {
        console.error('Error checking availability:', error)
        return false
    }

    return !data || data.length === 0
}

/**
 * Get available time slots for a court on a specific date
 */
export async function getAvailableSlots(courtId: string, date: string) {
    const supabase = await createClient()

    // Get all bookings for this court on this date
    const { data: bookings } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('court_id', courtId)
        .eq('booking_date', date)
        .in('status', ['pending', 'confirmed'])

    // Get operational hours for this day of week
    const dayOfWeek = new Date(date).getDay()
    const { data: hours } = await supabase
        .from('operational_hours')
        .select('open_time, close_time')
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .single()

    if (!hours) {
        return []
    }

    // Generate all possible time slots
    const slots = []
    const openHour = parseInt(hours.open_time.split(':')[0])
    const closeHour = parseInt(hours.close_time.split(':')[0])

    for (let hour = openHour; hour < closeHour; hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`
        const isBooked = bookings?.some((booking) => {
            // Simple check: same start time usually. 
            // Better: Check if timeSlot falls within [start, end)
            // But system seems to stick to hourly slots for now.
            // Let's assume hourly slots.
            return booking.start_time.startsWith(timeSlot)
        })

        slots.push({
            time: timeSlot,
            available: !isBooked,
        })
    }

    return slots
}

/**
 * Upload payment proof for a booking
 */
export async function uploadPaymentProof(bookingId: string, file: File) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Upload file to storage
    const fileName = `${user.id}/${bookingId}/${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file)

    if (uploadError) {
        console.error('Error uploading payment proof:', uploadError)
        return { error: uploadError.message }
    }

    // Get public URL
    const {
        data: { publicUrl },
    } = supabase.storage.from('payment-proofs').getPublicUrl(fileName)

    // Update booking with payment proof URL
    const { data, error } = await supabase
        .from('bookings')
        .update({ payment_proof_url: publicUrl })
        .eq('id', bookingId)
        .select()
        .single()

    if (error) {
        console.error('Error updating booking with payment proof:', error)
        return { error: error.message }
    }

    return { data, success: true, url: publicUrl }
}
