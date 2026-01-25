export interface Hall {
    id: string;
    name: string;
    type: 'Rubber' | 'Wooden' | 'Synthetic';
    pricePerHour: number;
    image: string;
    color: string;
    totalCourts: number;
    description: string;
    location: {
        city: string;
        district: string;
        subDistrict: string;
        address: string;
    };
}

export interface Court {
    id: string;
    number: number;
    hallId: string;
    status: 'available' | 'booked' | 'maintenance';
}

export interface TimeSlot {
    time: string;
    available: boolean;
}

export interface Product {
    id: string;
    name: string;
    category: 'Racket' | 'Shoes' | 'Accessory';
    price: number;
    image: string;
    isNew?: boolean;
}

export interface Message {
    role: 'user' | 'model';
    text: string;
}

export enum Tab {
    HOME = 'HOME',
    BOOK = 'BOOK',
    SHOP = 'SHOP',
}
