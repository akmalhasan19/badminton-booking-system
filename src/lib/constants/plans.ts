
export type SubscriptionPlan = 'STARTER' | 'PRO' | 'BUSINESS';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIAL';

export type FeatureName =
    | 'POS'
    | 'INVENTORY'
    | 'STAFF_REPORT'
    | 'WHATSAPP_NOTIF'
    | 'MULTI_STAFF'
    | 'ADVANCED_ANALYTICS'
    | 'EXPORT_DATA';

export interface PlanConfig {
    name: string;
    displayName: string;
    priceMonthly: number; // in IDR
    maxCourts: number;
    features: FeatureName[];
    description: string;
}

export const PLAN_FEATURES: Record<SubscriptionPlan, PlanConfig> = {
    STARTER: {
        name: 'STARTER',
        displayName: 'Starter',
        priceMonthly: 99000,
        maxCourts: 3,
        features: [],
        description: 'Untuk GOR kecil dengan 1-3 lapangan. Cocok untuk memulai.',
    },
    PRO: {
        name: 'PRO',
        displayName: 'Pro',
        priceMonthly: 299000,
        maxCourts: 8,
        features: ['POS', 'INVENTORY', 'STAFF_REPORT', 'WHATSAPP_NOTIF', 'EXPORT_DATA'],
        description: 'Untuk GOR menengah. Termasuk POS dan Inventory management.',
    },
    BUSINESS: {
        name: 'BUSINESS',
        displayName: 'Business',
        priceMonthly: 499000,
        maxCourts: 999,
        features: ['POS', 'INVENTORY', 'STAFF_REPORT', 'WHATSAPP_NOTIF', 'MULTI_STAFF', 'ADVANCED_ANALYTICS', 'EXPORT_DATA'],
        description: 'Untuk GOR besar atau chain. Fitur lengkap tanpa batasan.',
    },
};

export function hasFeature(plan: SubscriptionPlan, feature: FeatureName): boolean {
    return PLAN_FEATURES[plan].features.includes(feature);
}
