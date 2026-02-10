import { createServiceClient } from '@/lib/supabase/server'
import { validateApiKey } from '@/lib/api-auth'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!validateApiKey(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const supabase = createServiceClient()

    const { data: venue, error } = await supabase
        .from('venues')
        .select(`
            *,
            courts (
                id,
                name,
                court_number,
                is_active
            )
        `)
        .eq('id', id)
        .single()

    if (error) {
        return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }

    // Transform to match API contract
    const responseData = {
        id: venue.id,
        name: venue.name,
        address: venue.address,
        description: venue.description,
        start_hour: venue.open_hour,
        end_hour: venue.close_hour,
        facilities: venue.facilities || [], // Assuming facilities is a JSONB array/column
        photos: venue.images || [], // Assuming images/photos column exists
        courts: venue.courts.filter((c: any) => c.is_active).map((c: any) => ({
            id: c.id,
            name: c.name,
            court_number: c.court_number
        }))
    }

    return NextResponse.json({ data: responseData })
}
