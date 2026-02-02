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

export interface SmashVenue {
    id: string;
    name: string;
    address: string;
    operating_hours_start: number;
    operating_hours_end: number;
    booking_tolerance: number;
    price_per_hour?: number; // Optional, might not be in the venue object directly based on guide
    description?: string;
    image_url?: string;
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
                cache: 'no-store', // Ensure fresh data
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
     * Get Courts
     * Endpoint: GET /courts
     */
    getCourts: async (): Promise<any[]> => {
        try {
            const response = await fetch(`${BASE_URL}/courts`, {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return []; // Endpoint might not exist yet
                }
                console.warn(`Failed to fetch courts: ${response.status}`);
                return [];
            }

            const json = await response.json();
            return json.data || [];
        } catch (error) {
            console.error("Smash API Error (getCourts):", error);
            return [];
        }
    },

    /**
     * Check Availability (Get Bookings)
     * Endpoint: GET /bookings
     */
    checkAvailability: async (venueId: string, date: string): Promise<any[]> => {
        try {
            const params = new URLSearchParams({
                venue_id: venueId,
                date: date,
                // status: 'confirmed' // Optional filter mentioned in guide
            });

            const response = await fetch(`${BASE_URL}/bookings?${params.toString()}`, {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            if (!response.ok) {
                throw new Error(`Failed to check availability: ${response.status} ${response.statusText}`);
            }

            const json = await response.json();
            // The guide implies this returns "existing bookings" or "disabled slots"
            // "Logic: Fetch existing bookings... Disable slots..."
            // So we return the raw list of bookings/slots from the API
            return json.data || [];
        } catch (error) {
            console.error("Smash API Error (checkAvailability):", error);
            return [];
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
    }
};
