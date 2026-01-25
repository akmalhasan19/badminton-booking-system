import { Hall, Court, Product, TimeSlot } from './types';

export const MOCK_HALLS: Hall[] = [
    {
        id: 'h1',
        name: 'Mint Arena',
        type: 'Rubber',
        pricePerHour: 15,
        image: 'https://picsum.photos/800/600?random=1',
        color: 'bg-pastel-mint',
        totalCourts: 6,
        description: 'Pro-grade rubber mats for ultimate grip and shock absorption.'
    },
    {
        id: 'h2',
        name: 'Lilac Lane',
        type: 'Wooden',
        pricePerHour: 20,
        image: 'https://picsum.photos/800/600?random=2',
        color: 'bg-pastel-lilac',
        totalCourts: 4,
        description: 'Classic hardwood floors for that traditional crisp sound.'
    },
    {
        id: 'h3',
        name: 'Sky Court',
        type: 'Synthetic',
        pricePerHour: 18,
        image: 'https://picsum.photos/800/600?random=3',
        color: 'bg-pastel-blue',
        totalCourts: 8,
        description: 'Next-gen synthetic surface with futuristic lighting.'
    },
];

export const MOCK_PRODUCTS: Product[] = [
    {
        id: 'p1',
        name: 'AeroSmash Pro',
        category: 'Racket',
        price: 120,
        image: 'https://picsum.photos/400/400?random=4',
        isNew: true,
    },
    {
        id: 'p2',
        name: 'CloudWalkers 3',
        category: 'Shoes',
        price: 85,
        image: 'https://picsum.photos/400/400?random=5',
    },
    {
        id: 'p3',
        name: 'Neon Grip Tape',
        category: 'Accessory',
        price: 5,
        image: 'https://picsum.photos/400/400?random=6',
    },
    {
        id: 'p4',
        name: 'Shuttle Tube (12)',
        category: 'Accessory',
        price: 25,
        image: 'https://picsum.photos/400/400?random=7',
    },
];

export const TIME_SLOTS: TimeSlot[] = [
    { time: '09:00', available: true },
    { time: '10:00', available: false },
    { time: '11:00', available: true },
    { time: '12:00', available: true },
    { time: '13:00', available: true },
    { time: '14:00', available: false },
    { time: '15:00', available: true },
    { time: '16:00', available: false },
    { time: '17:00', available: true },
    { time: '18:00', available: true },
    { time: '19:00', available: false },
    { time: '20:00', available: true },
];

export const SYSTEM_INSTRUCTION = `You are Smashy, a fun, energetic, and helpful AI concierge for a trendy badminton court facility called "Smash & Serve".
Your target audience is Gen Z and Millennials, so keep the tone casual, friendly, emoji-friendly, and helpful.
You can help users pick the right racket, explain court types (Rubber vs Wooden), and give tips on improving their smash.
If asked about bookings, guide them to the booking tab.
If asked about gear, guide them to the shop tab.
Keep responses concise (under 100 words).`;
