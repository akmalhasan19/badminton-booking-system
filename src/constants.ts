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
        description: 'Pro-grade rubber mats for ultimate grip and shock absorption.',
        location: {
            city: 'Jakarta Timur',
            district: 'Pulo Gadung',
            subDistrict: 'Rawamangun',
            address: 'Jl. Pemuda No. 10'
        }
    },
    {
        id: 'h2',
        name: 'Lilac Lane',
        type: 'Wooden',
        pricePerHour: 20,
        image: 'https://picsum.photos/800/600?random=2',
        color: 'bg-pastel-lilac',
        totalCourts: 4,
        description: 'Classic hardwood floors for that traditional crisp sound.',
        location: {
            city: 'Jakarta Timur',
            district: 'Pulo Gadung',
            subDistrict: 'Kayu Putih',
            address: 'Jl. Kayu Putih Raya No. 5'
        }
    },
    {
        id: 'h3',
        name: 'Sky Court',
        type: 'Synthetic',
        pricePerHour: 18,
        image: 'https://picsum.photos/800/600?random=3',
        color: 'bg-pastel-blue',
        totalCourts: 8,
        description: 'Next-gen synthetic surface with futuristic lighting.',
        location: {
            city: 'Jakarta Utara',
            district: 'Kelapa Gading',
            subDistrict: 'Kelapa Gading Timur',
            address: 'Jl. Boulevard Raya'
        }
    },
    {
        id: 'h4',
        name: 'Quartz Complex',
        type: 'Wooden',
        pricePerHour: 22,
        image: 'https://picsum.photos/800/600?random=8',
        color: 'bg-gray-100',
        totalCourts: 12,
        description: 'Elite wooden flooring favored by professional championships.',
        location: {
            city: 'Jakarta Timur',
            district: 'Duren Sawit',
            subDistrict: 'Duren Sawit',
            address: 'Jl. Raden Inten II'
        }
    },
    {
        id: 'h5',
        name: 'Emerald City',
        type: 'Rubber',
        pricePerHour: 16,
        image: 'https://picsum.photos/800/600?random=9',
        color: 'bg-pastel-mint',
        totalCourts: 6,
        description: 'Eco-friendly sustainable rubber mats with perfect bounce.',
        location: {
            city: 'Jakarta Timur',
            district: 'Pulo Gadung',
            subDistrict: 'Jati',
            address: 'Jl. Jati Raya'
        }
    },
    {
        id: 'h6',
        name: 'Titanium Towers',
        type: 'Synthetic',
        pricePerHour: 25,
        image: 'https://picsum.photos/800/600?random=10',
        color: 'bg-pastel-lilac',
        totalCourts: 10,
        description: 'Premium synthetic courts with advanced shock absorption technology.',
        location: {
            city: 'Jakarta Selatan',
            district: 'Tebet',
            subDistrict: 'Tebet Timur',
            address: 'Jl. Tebet Raya'
        }
    },
    {
        id: 'h7',
        name: 'Ruby Ridge',
        type: 'Wooden',
        pricePerHour: 19,
        image: 'https://picsum.photos/800/600?random=11',
        color: 'bg-pastel-pink',
        totalCourts: 5,
        description: 'Cozy, warm wooden courts perfect for casual groups.',
        location: {
            city: 'Jakarta Timur',
            district: 'Pulo Gadung',
            subDistrict: 'Rawamangun',
            address: 'Jl. Balai Pustaka'
        }
    },
    {
        id: 'h8',
        name: 'Carbon Core',
        type: 'Rubber',
        pricePerHour: 14,
        image: 'https://picsum.photos/800/600?random=12',
        color: 'bg-gray-900',
        totalCourts: 20,
        description: 'High-capacity industrial style arena for tournaments.',
        location: {
            city: 'Jakarta Pusat',
            district: 'Kemayoran',
            subDistrict: 'Gunung Sahari Selatan',
            address: 'Jl. Angkasa'
        }
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
