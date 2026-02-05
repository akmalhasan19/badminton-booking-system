const BASE_URL = process.env.NEXT_PUBLIC_SMASH_API_BASE_URL;
const API_TOKEN = process.env.SMASH_API_TOKEN;

if (!BASE_URL) {
    console.warn("Missing NEXT_PUBLIC_SMASH_API_BASE_URL environment variable");
}

if (!API_TOKEN) {
    console.warn("Missing SMASH_API_TOKEN environment variable");
}

const headers = {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
};

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
    xendit_account_id?: string;
}

export interface SmashCourt {
    id: string;
    name: string;
    court_number: number;
    hourly_rate: number;
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
            console.log(`[SmashAPI] Fetching venues from: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            console.log(`[SmashAPI] Response status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[SmashAPI] Error body: ${errorText}`);
                throw new Error(`Failed to fetch venues: ${response.status} ${response.statusText}`);
            }

            const json = await response.json();
            console.log(`[SmashAPI] Venues found: ${json.data?.length || 0}`);
            return json.data || [];
        } catch (error) {
            console.error("Smash API Error (getVenues):", error);
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
            console.log(`[SmashAPI] Fetching venue details: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            if (!response.ok) {
                console.error(`[SmashAPI] Failed to fetch venue details: ${response.status}`);
                return null;
            }

            const json = await response.json();
            return json.data || null;
        } catch (error) {
            console.error("Smash API Error (getVenueDetails):", error);
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
            console.log(`[SmashAPI] Fetching venue courts: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            if (!response.ok) {
                console.error(`[SmashAPI] Failed to fetch venue courts: ${response.status}`);
                return [];
            }

            const json = await response.json();
            return json.data || [];
        } catch (error) {
            console.error("Smash API Error (getVenueCourts):", error);
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
            console.log(`[SmashAPI] Checking availability: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            if (!response.ok) {
                console.error(`[SmashAPI] Failed to check availability: ${response.status}`);
                return null;
            }

            const json = await response.json();
            return json.data || null;
        } catch (error) {
            console.error("Smash API Error (checkAvailability):", error);
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
                headers,
                body: JSON.stringify(bookingData),
            });

            if (!response.ok) {
                if (response.status === 409) {
                    return { error: "Slot already booked (Conflict)" };
                }
                const errorText = await response.text();
                return { error: `Booking failed: ${response.status} ${errorText}` };
            }

            const json = await response.json();
            return { success: true, data: json.data };
        } catch (error) {
            console.error("Smash API Error (createBooking):", error);
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
                headers,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                return { error: `Update failed: ${response.status} ${errorText}` };
            }

            const json = await response.json();
            return { success: true, data: json.data };
        } catch (error) {
            console.error("Smash API Error (updateBookingStatus):", error);
            return { error: "Network error or server unavailable" };
        }
    }
};
