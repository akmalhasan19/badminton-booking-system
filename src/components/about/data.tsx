import React from 'react';
import { Smile, Zap, Globe, Heart, Users, Trophy, Target, Lightbulb } from 'lucide-react';

export interface StatItem {
    id: string;
    label: string;
    value: string;
    color: string;
}

export interface ValueItem {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

export interface TimelineItem {
    id: string;
    year: string;
    title: string;
    description: string;
    color: string;
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    imageUrl: string;
    color: string;
}

export const STATS: StatItem[] = [
    { id: '1', label: 'Happy Players', value: '10K+', color: 'bg-neo-yellow' },
    { id: '2', label: 'Courts Booked', value: '50K+', color: 'bg-neo-pink' },
    { id: '3', label: 'Tournaments', value: '100+', color: 'bg-neo-blue' },
    { id: '4', label: 'Shuttles Smashed', value: '∞', color: 'bg-neo-green' },
];

export const VALUES: ValueItem[] = [
    {
        id: '1',
        title: 'Fair Play',
        description: 'We believe in a level playing field. Transparent pricing, no hidden fees, just pure sport.',
        icon: <Target size={ 48} strokeWidth = { 2.5} className = "text-black" />,
    color: 'bg-neo-blue'
  },
{
    id: '2',
        title: 'Speed Matters',
            description: 'Booking a court should be faster than a jump smash. Instant confirmation, zero lag.',
                icon: <Zap size={ 48 } strokeWidth = { 2.5} className = "text-black" />,
                    color: 'bg-neo-yellow'
},
{
    id: '3',
        title: 'Community First',
            description: 'We are built by players, for players. We support local clubs and grassroots badminton.',
                icon: <Users size={ 48 } strokeWidth = { 2.5} className = "text-black" />,
                    color: 'bg-neo-green'
},
{
    id: '4',
        title: 'Passion Driven',
            description: 'We live and breathe badminton. It is not just a sport, it is a lifestyle.',
                icon: <Heart size={ 48 } strokeWidth = { 2.5} className = "text-black" />,
                    color: 'bg-neo-pink'
},
];

export const TIMELINE: TimelineItem[] = [
    {
        id: '1',
        year: '2023',
        title: 'Serve Off',
        description: 'Launched our beta in a single local club. The booking system was a spreadsheet.',
        color: 'bg-neo-yellow'
    },
    {
        id: '2',
        year: '2024',
        title: 'The Rally',
        description: 'Expanded to 50+ venues across the city. Automated everything. Deleted the spreadsheet.',
        color: 'bg-neo-blue'
    },
    {
        id: '3',
        year: '2025',
        title: 'Game Point',
        description: 'Introducing AI coaching and smart court analytics. The future of badminton is here.',
        color: 'bg-neo-pink'
    },
    {
        id: '4',
        year: '2026',
        title: 'Grand Slam',
        description: 'Going global. Connecting players across borders. World domination (of badminton).',
        color: 'bg-neo-green'
    }
];

export const TEAM: TeamMember[] = [
    {
        id: '1',
        name: 'Akmal "Ace"',
        role: 'Founder & CEO',
        imageUrl: 'https://picsum.photos/400/400?random=1',
        color: 'bg-neo-green'
    },
    {
        id: '2',
        name: 'Sarah "Smash"',
        role: 'Head of Product',
        imageUrl: 'https://picsum.photos/400/400?random=2',
        color: 'bg-neo-pink'
    },
    {
        id: '3',
        name: 'David "Drop"',
        role: 'Lead Developer',
        imageUrl: 'https://picsum.photos/400/400?random=3',
        color: 'bg-neo-blue'
    },
    {
        id: '4',
        name: 'Jessica "Net"',
        role: 'Community Manager',
        imageUrl: 'https://picsum.photos/400/400?random=4',
        color: 'bg-neo-yellow'
    },
];
