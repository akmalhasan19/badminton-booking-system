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

    const { data: courts, error } = await supabase
        .from('courts')
        .select('id, name, court_number, is_active')
        .eq('venue_id', id)
        .eq('is_active', true)
        .order('court_number', { ascending: true })

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch courts' }, { status: 500 })
    }

    return NextResponse.json({
        data: courts.map(court => ({
            id: court.id,
            name: court.name,
            court_number: court.court_number
        })),
        meta: {
            count: courts.length
        }
    })
}
