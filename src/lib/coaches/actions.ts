'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'

// ============== TYPES ==============

export interface Coach {
    id: string
    user_id: string
    name: string
    bio: string | null
    avatar_url: string | null
    specialization: string[]
    level: 'beginner' | 'intermediate' | 'advanced' | 'professional'
    experience_years: number
    certifications: string[]
    city: string
    district: string | null
    address: string | null
    price_per_hour: number
    currency: string
    is_active: boolean
    accepts_online_booking: boolean
    average_rating: number
    total_sessions: number
    total_reviews: number
    created_at: string
    updated_at: string
}

export interface CoachAvailabilitySlot {
    id: string
    coach_id: string
    day_of_week: number // 0=Sunday, 6=Saturday
    start_time: string
    end_time: string
    is_available: boolean
    max_bookings_per_slot: number
    created_at: string
    updated_at: string
}

export interface CoachBooking {
    id: string
    coach_id: string
    user_id: string
    availability_slot_id: string | null
    booking_date: string
    start_time: string
    end_time: string
    duration_hours: number
    price_per_hour: number
    total_price: number
    currency: string
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
    notes: string | null
    session_type: string | null
    attendees_count: number
    payment_method: string | null
    payment_proof_url: string | null
    payment_confirmed_at: string | null
    cancelled_at: string | null
    cancellation_reason: string | null
    cancelled_by: string | null
    created_at: string
    updated_at: string
}

export interface CoachSearchFilters {
    search?: string
    city?: string
    level?: string
    specialization?: string
    minPrice?: number
    maxPrice?: number
}

// ============== COACH DISCOVERY ==============

/**
 * Server action to fetch coaches with optional filters
 * @param filters - Search and filter options
 */
export async function getCoaches(filters?: CoachSearchFilters): Promise<Coach[]> {
    const supabase = await createClient()

    let query = supabase
        .from('coaches')
        .select('*')
        .eq('is_active', true)
        .order('average_rating', { ascending: false })

    // Apply filters
    if (filters?.search) {
        const searchTerm = `%${filters.search.toLowerCase()}%`
        query = query.or(`name.ilike.${searchTerm},bio.ilike.${searchTerm}`)
    }

    if (filters?.city) {
        query = query.eq('city', filters.city)
    }

    if (filters?.level) {
        query = query.eq('level', filters.level)
    }

    if (filters?.specialization) {
        query = query.contains('specialization', [filters.specialization])
    }

    if (filters?.minPrice !== undefined) {
        query = query.gte('price_per_hour', filters.minPrice)
    }

    if (filters?.maxPrice !== undefined) {
        query = query.lte('price_per_hour', filters.maxPrice)
    }

    const { data, error } = await query

    if (error) {
        console.error('Failed to fetch coaches:', error)
        return []
    }

    return data || []
}

/**
 * Server action to fetch a single coach by ID
 * @param coachId - Coach UUID
 */
export async function getCoachById(coachId: string): Promise<Coach | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', coachId)
        .eq('is_active', true)
        .single()

    if (error) {
        console.error('Failed to fetch coach:', error)
        return null
    }

    return data
}

// ============== AVAILABILITY ==============

/**
 * Server action to fetch coach availability slots
 * @param coachId - Coach UUID
 * @param dayOfWeek - Optional day filter (0-6)
 */
export async function getCoachAvailability(
    coachId: string,
    dayOfWeek?: number
): Promise<CoachAvailabilitySlot[]> {
    const supabase = await createClient()

    let query = supabase
        .from('coach_availability_slots')
        .select('*')
        .eq('coach_id', coachId)
        .eq('is_available', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true })

    if (dayOfWeek !== undefined) {
        query = query.eq('day_of_week', dayOfWeek)
    }

    const { data, error } = await query

    if (error) {
        console.error('Failed to fetch coach availability:', error)
        return []
    }

    return data || []
}

/**
 * Check if a coach is available for a specific date and time
 * @param coachId - Coach UUID
 * @param bookingDate - Date string (YYYY-MM-DD)
 * @param startTime - Time string (HH:MM:SS)
 * @param endTime - Time string (HH:MM:SS)
 */
export async function checkCoachAvailability(
    coachId: string,
    bookingDate: string,
    startTime: string,
    endTime: string
): Promise<{ available: boolean; conflict?: string }> {
    const supabase = await createClient()

    // Check for existing bookings that would conflict
    const { data: existingBookings, error } = await supabase
        .from('coach_bookings')
        .select('id, start_time, end_time, status')
        .eq('coach_id', coachId)
        .eq('booking_date', bookingDate)
        .neq('status', 'cancelled')

    if (error) {
        console.error('Failed to check availability:', error)
        return { available: false, conflict: 'Error checking availability' }
    }

    // Check for time conflicts
    for (const booking of existingBookings || []) {
        const existingStart = booking.start_time
        const existingEnd = booking.end_time

        // Check if times overlap
        if (
            (startTime >= existingStart && startTime < existingEnd) ||
            (endTime > existingStart && endTime <= existingEnd) ||
            (startTime <= existingStart && endTime >= existingEnd)
        ) {
            return {
                available: false,
                conflict: `Time slot conflicts with existing booking from ${existingStart} to ${existingEnd}`,
            }
        }
    }

    return { available: true }
}

// ============== BOOKING ==============

/**
 * Server action to create a coach booking
 */
export async function createCoachBooking(data: {
    coachId: string
    bookingDate: string
    startTime: string
    endTime: string
    durationHours: number
    notes?: string
    sessionType?: string
    attendeesCount?: number
}): Promise<{
    success: boolean
    data?: CoachBooking
    error?: string
}> {
    const user = await getCurrentUser()

    if (!user) {
        return { success: false, error: 'Unauthorized: Please login to book a session.' }
    }

    const supabase = createServiceClient()

    // 1. Get coach details for pricing
    const { data: coach, error: coachError } = await supabase
        .from('coaches')
        .select('id, price_per_hour, currency, is_active, accepts_online_booking')
        .eq('id', data.coachId)
        .single()

    if (coachError || !coach) {
        return { success: false, error: 'Coach not found' }
    }

    if (!coach.is_active || !coach.accepts_online_booking) {
        return { success: false, error: 'Coach is not accepting bookings at this time' }
    }

    // 2. Check availability (conflict detection)
    const conflictCheck = await checkCoachAvailability(
        data.coachId,
        data.bookingDate,
        data.startTime,
        data.endTime
    )

    if (!conflictCheck.available) {
        return { success: false, error: conflictCheck.conflict || 'Time slot not available' }
    }

    // 3. Calculate total price
    const totalPrice = coach.price_per_hour * data.durationHours

    // 4. Insert booking
    const { data: booking, error: bookingError } = await supabase
        .from('coach_bookings')
        .insert({
            coach_id: data.coachId,
            user_id: user.id,
            booking_date: data.bookingDate,
            start_time: data.startTime,
            end_time: data.endTime,
            duration_hours: data.durationHours,
            price_per_hour: coach.price_per_hour,
            total_price: totalPrice,
            currency: coach.currency,
            status: 'pending',
            notes: data.notes || null,
            session_type: data.sessionType || 'private',
            attendees_count: data.attendeesCount || 1,
        })
        .select()
        .single()

    if (bookingError) {
        console.error('Failed to create coach booking:', bookingError)
        return { success: false, error: 'Failed to create booking. Please try again.' }
    }

    revalidatePath('/coaching')
    return { success: true, data: booking }
}

/**
 * Server action to get user's coach bookings
 */
export async function getUserCoachBookings(): Promise<
    (CoachBooking & { coach: Coach })[]
> {
    const user = await getCurrentUser()

    if (!user) {
        return []
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('coach_bookings')
        .select(`
            *,
            coach:coaches(*)
        `)
        .eq('user_id', user.id)
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: false })

    if (error) {
        console.error('Failed to fetch user coach bookings:', error)
        return []
    }

    return data || []
}

/**
 * Server action to cancel a coach booking
 */
export async function cancelCoachBooking(
    bookingId: string,
    reason?: string
): Promise<{ success: boolean; error?: string }> {
    const user = await getCurrentUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = createServiceClient()

    // Verify ownership
    const { data: booking, error: fetchError } = await supabase
        .from('coach_bookings')
        .select('user_id, status')
        .eq('id', bookingId)
        .single()

    if (fetchError || !booking) {
        return { success: false, error: 'Booking not found' }
    }

    if (booking.user_id !== user.id) {
        return { success: false, error: 'Unauthorized to cancel this booking' }
    }

    if (booking.status !== 'pending') {
        return {
            success: false,
            error: 'Only pending bookings can be cancelled',
        }
    }

    // Update booking status
    const { error: updateError } = await supabase
        .from('coach_bookings')
        .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancellation_reason: reason || null,
            cancelled_by: user.id,
        })
        .eq('id', bookingId)

    if (updateError) {
        console.error('Failed to cancel coach booking:', updateError)
        return { success: false, error: 'Failed to cancel booking' }
    }

    revalidatePath('/coaching')
    return { success: true }
}

/**
 * Server action to update coach booking status (for admins/coaches)
 */
export async function updateCoachBookingStatus(
    bookingId: string,
    status: 'confirmed' | 'completed' | 'cancelled'
): Promise<{ success: boolean; error?: string }> {
    const user = await getCurrentUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = createServiceClient()

    // Verify the user is admin or the coach
    const { data: booking, error: fetchError } = await supabase
        .from('coach_bookings')
        .select(`
            id,
            coach_id,
            coaches!inner(user_id)
        `)
        .eq('id', bookingId)
        .single()

    if (fetchError || !booking) {
        return { success: false, error: 'Booking not found' }
    }

    // Extract coach user_id from the nested relation
    const coachUserId = (booking.coaches as any)?.user_id

    // Check if user is admin
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAdmin = userData?.role === 'admin'
    const isCoach = coachUserId === user.id

    if (!isAdmin && !isCoach) {
        return { success: false, error: 'Unauthorized to update this booking' }
    }

    // Update status
    const updateData: any = { status }

    if (status === 'confirmed') {
        updateData.payment_confirmed_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
        .from('coach_bookings')
        .update(updateData)
        .eq('id', bookingId)

    if (updateError) {
        console.error('Failed to update coach booking status:', updateError)
        return { success: false, error: 'Failed to update booking status' }
    }

    revalidatePath('/coaching')
    revalidatePath('/partner/coach')
    return { success: true }
}
