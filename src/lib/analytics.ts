import { BetaAnalyticsDataClient } from '@google-analytics/data';

const propertyId = process.env.GA_PROPERTY_ID; // e.g. '342673232'

// Credentials from env vars
const credentials = {
    client_email: process.env.GA_CLIENT_EMAIL,
    private_key: process.env.GA_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Fix newlines if passed as string
};

const analyticsDataClient = (credentials.client_email && credentials.private_key)
    ? new BetaAnalyticsDataClient({ credentials })
    : null;

export interface AnalyticsStats {
    activeUsers: number;
    totalUsers: number;
    sessions: number;
    pageViews: number;
}

export async function getAnalyticsStats(): Promise<AnalyticsStats | null> {
    if (!analyticsDataClient || !propertyId) {
        console.warn("Google Analytics credentials or Property ID missing.");
        return null;
    }

    try {
        const [response] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [
                {
                    startDate: '30daysAgo',
                    endDate: 'today',
                },
            ],
            metrics: [
                { name: 'activeUsers' },
                { name: 'totalUsers' },
                { name: 'sessions' },
                { name: 'screenPageViews' },
            ],
        });

        const row = response.rows?.[0];
        if (!row) return null;

        return {
            activeUsers: parseInt(row.metricValues?.[0]?.value || '0'),
            totalUsers: parseInt(row.metricValues?.[1]?.value || '0'),
            sessions: parseInt(row.metricValues?.[2]?.value || '0'),
            pageViews: parseInt(row.metricValues?.[3]?.value || '0'),
        };
    } catch (error) {
        console.error("Failed to fetch GA data:", error);
        return null;
    }
}
