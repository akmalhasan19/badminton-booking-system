import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Graceful fallback if Redis is not configured (to avoid crashing app if envs are missing)
const isRedisConfigured = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

if (!isRedisConfigured) {
    console.warn("Upstash Redis environment variables missing. Rate limiting validation will be skipped locally.");
}

const redis = isRedisConfigured
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    : new Redis({ url: 'https://mock-url.upstash.io', token: 'mock-token' }); // Mock for build time or missing envs

// Create a new ratelimiter, that allows 10 requests per 10 seconds
export const ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
    prefix: "@upstash/ratelimit",
});

export const canRateLimit = isRedisConfigured;
