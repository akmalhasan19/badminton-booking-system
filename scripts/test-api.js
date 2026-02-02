
const { smashApi } = require('../src/lib/smash-api');

// Mock process.env for the test if not running with dotenv (but usually we run with something that loads it)
// We will rely on the user running this with 'npx tsx' or ensuring env vars are present.
// Actually, it's safer to just import the module and run it if the environment is set up.

async function testApi() {
    console.log("Testing Smash API...");
    console.log("Base URL:", process.env.NEXT_PUBLIC_SMASH_API_BASE_URL);
    // Don't log full token for security, just presence
    console.log("Token Present:", !!process.env.SMASH_API_TOKEN);

    try {
        console.log("\nFetching Venues...");
        const venues = await smashApi.getVenues();
        console.log("Venues Response:", JSON.stringify(venues, null, 2));

        if (venues.length > 0) {
            console.log(`\nFound ${venues.length} venues.`);
            const firstVenueId = venues[0].id;

            console.log(`\nChecking availability for venue ${firstVenueId} on 2026-02-03...`);
            const availability = await smashApi.checkAvailability(firstVenueId, '2026-02-03');
            console.log("Availability:", JSON.stringify(availability, null, 2));
        } else {
            console.log("\nNo venues found.");
        }

        console.log("\nFetching Courts...");
        const courts = await smashApi.getCourts();
        console.log("Courts Response:", JSON.stringify(courts, null, 2));

    } catch (error) {
        console.error("API Test Failed:", error);
    }
}

testApi();
