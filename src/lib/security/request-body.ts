import { NextResponse } from 'next/server'

type ParseJsonOptions = {
    maxBytes: number
    requireJsonContentType?: boolean
}

const JSON_CONTENT_TYPE = 'application/json'

export async function parseJsonBodyWithLimit<T>(
    request: Request,
    { maxBytes, requireJsonContentType = true }: ParseJsonOptions
): Promise<
    | { ok: true; data: T }
    | { ok: false; response: NextResponse }
> {
    const contentType = request.headers.get('content-type') || ''
    if (requireJsonContentType && !contentType.toLowerCase().includes(JSON_CONTENT_TYPE)) {
        return {
            ok: false,
            response: NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 }),
        }
    }

    const contentLength = request.headers.get('content-length')
    if (contentLength) {
        const parsedLength = Number(contentLength)
        if (Number.isFinite(parsedLength) && parsedLength > maxBytes) {
            return {
                ok: false,
                response: NextResponse.json({ error: 'Payload too large' }, { status: 413 }),
            }
        }
    }

    let rawBody = ''
    try {
        rawBody = await request.text()
    } catch {
        return {
            ok: false,
            response: NextResponse.json({ error: 'Invalid request body' }, { status: 400 }),
        }
    }

    if (Buffer.byteLength(rawBody, 'utf8') > maxBytes) {
        return {
            ok: false,
            response: NextResponse.json({ error: 'Payload too large' }, { status: 413 }),
        }
    }

    try {
        const parsed = JSON.parse(rawBody) as T
        return { ok: true, data: parsed }
    } catch {
        return {
            ok: false,
            response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
        }
    }
}
