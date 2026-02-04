'use server'

import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/actions'

export async function getDashboardStats() {
    const isUserAdmin = await isAdmin()
    if (!isUserAdmin) return null

    const supabase = await createClient()

    // Parallel fetch for speed
    const [bookingsRes, usersRes] = await Promise.all([
        supabase.from('bookings').select('id, total_price, status', { count: 'exact' }),
        supabase.from('users').select('id', { count: 'exact' }) // Assuming public.users
    ])

    const totalBookings = bookingsRes.count || 0
    const bookings = bookingsRes.data || []

    // Calculate Revenue (confirmed/completed bookings)
    const revenue = bookings
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .reduce((acc, curr) => acc + (curr.total_price || 0), 0)

    const activeUsers = usersRes.count || 0

    // Growth mocked for now, or calculate based on date if needed
    const growth = "+12%"

    return {
        totalBookings,
        revenue,
        activeUsers,
        growth
    }
}
