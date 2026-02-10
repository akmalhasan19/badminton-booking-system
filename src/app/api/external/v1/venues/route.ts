import { createServiceClient } from '@/lib/supabase/server'
import { validateApiKey } from '@/lib/api-auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    if (!validateApiKey(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { data: venues, error } = await supabase
        .from('venues')
        .select('*')
        .eq('is_active', true)

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch venues' }, { status: 500 })
    }

    return NextResponse.json({
        data: venues.map(venue => ({
            id: venue.id,
            name: venue.name,
            address: venue.address,
            description: venue.description,
            start_hour: venue.open_hour,
            end_hour: venue.close_hour,
            // Add other fields as necessary, ensuring snake_case response if required by contract
        })),
        meta: {
            count: venues.length
        }
    })
}
