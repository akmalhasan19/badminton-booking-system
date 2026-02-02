import { createServiceClient } from '@/lib/supabase/server'
import { validateApiKey } from '@/lib/api-auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    if (!validateApiKey(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { data: courts, error } = await supabase
        .from('courts')
        .select('id, name, hourly_rate, is_active, description, image_url')
        .eq('is_active', true)
        .order('court_number', { ascending: true })

    if (error) {
        console.error('Error fetching courts:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    // Map to API response format
    const mappedCourts = courts.map((court: any) => ({
        id: court.id,
        name: court.name,
        hourly_rate: court.hourly_rate,
        is_active: court.is_active,
        description: court.description || '', // Default to empty string if null
        photo_url: court.image_url ? [court.image_url] : [] // Convert single image string to array
    }))

    return NextResponse.json({ data: mappedCourts })
}
