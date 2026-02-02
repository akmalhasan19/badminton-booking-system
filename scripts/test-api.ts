
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
        console.log("\nFetching Venues...");
        const venues = await smashApi.getVenues();
        console.log("Venues Response:", JSON.stringify(venues, null, 2));

        if (venues.length > 0) {
            console.log(`\nFound ${venues.length} venues.`);
        } else {
            console.log("\nNo venues found.");
        }

        console.log("\nFetching Courts...");
        const courts = await smashApi.getCourts();
        // Summary of courts
        console.log(`Found ${courts.length} courts.`);

    } catch (error) {
        console.error("API Test Failed:", error);
    }
}

run();
