
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local BEFORE importing app code
console.log("Loading .env.local...");
config({ path: resolve(process.cwd(), '.env.local') });

async function run() {
    // Dynamic import to ensure env is loaded first
    const { smashApi } = await import('../src/lib/smash-api');

    console.log("Testing Smash API...");
    console.log("Base URL:", process.env.NEXT_PUBLIC_SMASH_API_BASE_URL);
    // Don't log full token for security
    console.log("Token Present:", !!process.env.SMASH_API_TOKEN);

    try {
        console.log("\n--- Fetching Venues ---");
        const venues = await smashApi.getVenues();
        console.log("Venues Response:", JSON.stringify(venues, null, 2));

        if (venues.length > 0) {
            console.log(`\nFound ${venues.length} venues.`);

            // Test getVenueDetails for first venue
            const firstVenueId = venues[0].id;
            console.log(`\n--- Fetching Venue Details for ${firstVenueId} ---`);
            const venueDetails = await smashApi.getVenueDetails(firstVenueId);
            console.log("Venue Details:", JSON.stringify(venueDetails, null, 2));

            if (venueDetails && venueDetails.courts) {
                console.log(`Found ${venueDetails.courts.length} courts in venue.`);
            }

            // Test availability
            const today = new Date().toISOString().split('T')[0];
            console.log(`\n--- Checking Availability for ${today} ---`);
            const availability = await smashApi.checkAvailability(firstVenueId, today);
            console.log("Availability:", JSON.stringify(availability, null, 2));
        } else {
            console.log("\nNo venues found.");
        }

    } catch (error) {
        console.error("API Test Failed:", error);
    }
}

run();
