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

const createLimiter = (prefix: string, requests: number, window: `${number} ${"ms" | "s" | "m" | "h" | "d"}`) =>
    new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(requests, window),
        analytics: true,
        prefix,
    });

// Keep compatibility with existing imports (`ratelimit`) for webhook endpoint
export const ratelimit = createLimiter("@upstash/ratelimit:xendit-webhook", 10, "10 s");

export const partnerSubmissionIpRatelimit = createLimiter("@upstash/ratelimit:partner:ip", 5, "1 h");
export const partnerSubmissionEmailRatelimit = createLimiter("@upstash/ratelimit:partner:email", 3, "1 h");

export const coachSubmissionIpRatelimit = createLimiter("@upstash/ratelimit:coach:ip", 5, "1 h");
export const coachSubmissionEmailRatelimit = createLimiter("@upstash/ratelimit:coach:email", 3, "1 h");

export const debugActionCooldownRatelimit = createLimiter("@upstash/ratelimit:debug:cooldown", 1, "20 s");
export const webhookInvalidLogRatelimit = createLimiter("@upstash/ratelimit:webhook:invalid-log", 1, "60 s");

export const canRateLimit = isRedisConfigured;
