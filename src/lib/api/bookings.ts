import { createClient } from '@/lib/supabase/server'

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

    // 1. Check availability FIRST
    const isAvailable = await checkAvailability(
        bookingData.courtId,
        bookingData.bookingDate,
        bookingData.startTime
    )

    if (!isAvailable) {
        return { error: 'Time slot is not available' }
    }

    // 2. Fetch court details for price calculation (Security Fix)
    const { data: court, error: courtError } = await supabase
        .from('courts')
        .select('price_per_hour')
        .eq('id', bookingData.courtId)
        .single()

    if (courtError || !court) {
        return { error: 'Court not found' }
    }

    // Calculate total price server-side
    // TODO: Add dynamic pricing logic here if needed (e.g. peak hours)
    const totalPrice = court.price_per_hour * bookingData.durationHours

    // 3. Double-check availability immediately before insert (Race condition mitigation)
    // Note: A database unique constraint on (court_id, booking_date, start_time) is the only 100% fix.
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
            total_price: totalPrice,
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
        const isBooked = bookings?.some((booking) => booking.start_time === timeSlot)

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
