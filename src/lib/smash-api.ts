import { logger } from "@/lib/logger";

const BASE_URL = process.env.NEXT_PUBLIC_SMASH_API_BASE_URL;

const getHeaders = () => {
    const token = process.env.SMASH_API_TOKEN?.trim();

    if (!token) {
        logger.warn("Missing SMASH_API_TOKEN environment variable");
    } else {
        logger.debug({ tokenPrefix: token.substring(0, 10) + "..." }, "Token used for request");
    }

    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

// Validating Base URL once
if (!BASE_URL) {
    // We use console.warn directly here because logger might depend on env vars too, 
    // but better to use logger if available.
    // logger.warn("Missing NEXT_PUBLIC_SMASH_API_BASE_URL environment variable");
    // Actually safe to use logger.
    // But since this is module scope, let's keep it simple or just warn on usage.
}

// ============== TYPES ==============

export interface SmashVenue {
    id: string;
    name: string;
    address: string;
    photo_url?: string;
    courts_count?: number;
    operating_hours_start: number;
    operating_hours_end: number;
    booking_tolerance: number;
    description?: string;
    latitude?: number;
    longitude?: number;
    city?: string;
}

export interface SmashCourt {
    id: string;
    name: string;
    court_number: number;
    hourly_rate: number;
    photo_url?: string;
    is_active?: boolean;
}

export interface SmashVenueDetails extends SmashVenue {
    courts: SmashCourt[];
}

export interface SmashAvailabilitySlot {
    time: string;
    available: boolean;
    price?: number;
    status?: string;
}

export interface SmashCourtAvailability {
    court_id: string;
    court_name: string;
    slots: SmashAvailabilitySlot[];
}

export interface SmashAvailabilityResponse {
    venue_id: string;
    date: string;
    operating_hours: { start: number; end: number };
    courts: SmashCourtAvailability[];
}

export interface SmashBooking {
    venue_id: string;
    court_id: string;
    booking_date: string;
    start_time: string;
    duration: number;
    customer_name: string;
    phone: string;
}

// ============== API METHODS ==============

export const smashApi = {
    /**
     * Get Available Venues
     * Endpoint: GET /venues
     */
    getVenues: async (): Promise<SmashVenue[]> => {
        try {
            const url = `${BASE_URL}/venues?is_active=true&limit=10`;
            logger.info({ url }, `[SmashAPI] Fetching venues`);

            const response = await fetch(url, {
                method: 'GET',
                headers: getHeaders(),
                cache: 'no-store',
            });

            logger.info({ status: response.status }, `[SmashAPI] Response status`);

            if (!response.ok) {
                const errorText = await response.text();
                logger.error({ status: response.status, body: errorText }, `[SmashAPI] Error fetching venues`);
                throw new Error(`Failed to fetch venues: ${response.status} ${response.statusText}`);
            }

            const json = await response.json();
            logger.info({ count: json.data?.length || 0 }, `[SmashAPI] Venues found`);
            return json.data || [];
        } catch (error) {
            logger.error({ error }, "Smash API Error (getVenues)");
            return [];
        }
    },

    /**
     * Get Venue Details (with Courts)
     * Endpoint: GET /venues/:id
     */
    getVenueDetails: async (venueId: string): Promise<SmashVenueDetails | null> => {
        try {
            const url = `${BASE_URL}/venues/${venueId}`;
            logger.info({ url }, `[SmashAPI] Fetching venue details`);

            const response = await fetch(url, {
                method: 'GET',
                headers: getHeaders(),
                cache: 'no-store',
            });

            if (!response.ok) {
                logger.error({ status: response.status, venueId }, `[SmashAPI] Failed to fetch venue details`);
                return null;
            }

            const json = await response.json();
            return json.data || null;
        } catch (error) {
            logger.error({ error, venueId }, "Smash API Error (getVenueDetails)");
            return null;
        }
    },

    /**
     * Get Courts for a Venue
     * Endpoint: GET /venues/:id/courts
     */
    getVenueCourts: async (venueId: string): Promise<SmashCourt[]> => {
        try {
            const url = `${BASE_URL}/venues/${venueId}/courts`;
            logger.info({ url }, `[SmashAPI] Fetching venue courts`);

            const response = await fetch(url, {
                method: 'GET',
                headers: getHeaders(),
                cache: 'no-store',
            });

            if (!response.ok) {
                logger.error({ status: response.status, venueId }, `[SmashAPI] Failed to fetch venue courts`);
                return [];
            }

            const json = await response.json();
            return json.data || [];
        } catch (error) {
            logger.error({ error, venueId }, "Smash API Error (getVenueCourts)");
            return [];
        }
    },

    /**
     * Check Availability (Real-time)
     * Endpoint: GET /venues/:id/availability?date=YYYY-MM-DD
     */
    checkAvailability: async (venueId: string, date: string): Promise<SmashAvailabilityResponse | null> => {
        try {
            const url = `${BASE_URL}/venues/${venueId}/availability?date=${date}`;
            logger.debug({ url }, `[SmashAPI] Checking availability`);

            const response = await fetch(url, {
                method: 'GET',
                headers: getHeaders(),
                cache: 'no-store',
            });

            if (!response.ok) {
                logger.error({ status: response.status, venueId, date }, `[SmashAPI] Failed to check availability`);
                return null;
            }

            const json = await response.json();
            return json.data || null;
        } catch (error) {
            logger.error({ error, venueId, date }, "Smash API Error (checkAvailability)");
            return null;
        }
    },

    /**
     * Create Booking
     * Endpoint: POST /bookings
     */
    createBooking: async (bookingData: SmashBooking) => {
        try {
            const response = await fetch(`${BASE_URL}/bookings`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(bookingData),
            });

            if (!response.ok) {
                if (response.status === 409) {
                    return { error: "Slot already booked (Conflict)" };
                }
                const errorText = await response.text();
                logger.error({ status: response.status, body: errorText, bookingData }, "Booking creation failed");
                return { error: `Booking failed: ${response.status} ${errorText}` };
            }

            const json = await response.json();
            return { success: true, data: json.data };
        } catch (error) {
            logger.error({ error }, "Smash API Error (createBooking)");
            return { error: "Network error or server unavailable" };
        }
    },

    /**
     * @deprecated This endpoint uses PATCH which doesn't create transaction records.
     * Use webhook sync instead: syncBookingToPartner() in partner-sync.ts
     * 
     * Update Booking Status (Payment Confirmation)
     * Endpoint: PATCH /bookings/:id
     * 
     * WARNING: This PATCH endpoint only updates booking status but does NOT:
     * - Create transaction records (required for revenue dashboard)
     * - Create transaction_items (required for proper revenue tracking)
     * 
     * For PWA payment sync, always use /api/webhooks/pwa-sync instead.
     */
    updateBookingStatus: async (bookingId: string, status: string, paidAmount?: number) => {
        try {
            const payload: { status: string; paid_amount?: number } = { status };
            if (paidAmount !== undefined) {
                payload.paid_amount = paidAmount;
            }

            const response = await fetch(`${BASE_URL}/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                logger.error({ status: response.status, body: errorText, bookingId }, "Update booking status failed");
                return { error: `Update failed: ${response.status} ${errorText}` };
            }

            const json = await response.json();
            return { success: true, data: json.data };
        } catch (error) {
            logger.error({ error, bookingId }, "Smash API Error (updateBookingStatus)");
            return { error: "Network error or server unavailable" };
        }
    }
};
