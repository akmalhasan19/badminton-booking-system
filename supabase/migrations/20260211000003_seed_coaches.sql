-- Seed data for coaches feature
-- This file populates the coaches tables with sample data for testing
-- Run this after the main coaches migration (20260211000002_add_coaches.sql)

-- Sample Coaches
INSERT INTO public.coaches (
    id,
    user_id,
    name,
    bio,
    avatar_url,
    specialization,
    level,
    experience_years,
    certifications,
    city,
    district,
    price_per_hour,
    average_rating,
    total_sessions,
    total_reviews,
    is_active,
    accepts_online_booking
) VALUES
-- Coach 1: Advanced Doubles Coach
(
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM auth.users LIMIT 1), -- Will use first user, replace with actual coach user
    'Coach Budi Santoso',
    'Former national team player with over 10 years of competitive experience. Specializes in advanced doubles tactics, rotation, and high-pressure game psychology. Has coached multiple regional champions.',
    'https://images.unsplash.com/photo-1542596594-649edbc13630?q=80&w=1000&auto=format&fit=crop',
    ARRAY['Doubles Strategy', 'Advanced Tactics', 'Competition Preparation'],
    'advanced',
    15,
    ARRAY['National Doubles Champion 2015', 'Certified BWF Level 2 Coach', 'Head Coach at PB Jaya'],
    'Jakarta',
    'Jakarta Selatan',
    150000,
    4.9,
    128,
    95,
    true,
    true
),
-- Coach 2: Beginner & Fundamentals Coach
(
    '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM auth.users LIMIT 1),
    'Siti Rahmawati',
    'Patient and detail-oriented coach perfect for beginners and children. Focuses on building a strong foundation with correct footwork and stroke mechanics to prevent injury and ensure long-term progress.',
    'https://images.unsplash.com/photo-1626244422523-26330452377d?q=80&w=1000&auto=format&fit=crop',
    ARRAY['Basics & Footwork', 'Youth Training', 'Injury Prevention'],
    'beginner',
    5,
    ARRAY['West Java Provincial Silver Medalist', 'Best Youth Coach Award 2023', 'Certified Youth Sports Coach'],
    'Bandung',
    'Bandung Utara',
    100000,
    4.8,
    85,
    72,
    true,
    true
),
-- Coach 3: Power & Smash Specialist
(
    '33333333-3333-3333-3333-333333333333',
    (SELECT id FROM auth.users LIMIT 1),
    'Rizky Firmansyah',
    'Known for his explosive playstyle, Rizky teaches players how to generate maximum power in their smashes and clears. Also covers physical conditioning specifically for badminton power and endurance.',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop',
    ARRAY['Smash Power', 'Physical Conditioning', 'Explosive Movements'],
    'intermediate',
    8,
    ARRAY['Surabaya Open Winner 2019', 'Physical Trainer Certificate', 'Sports Science Diploma'],
    'Surabaya',
    'Surabaya Timur',
    125000,
    4.7,
    56,
    48,
    true,
    true
),
-- Coach 4: Singles Specialist
(
    '44444444-4444-4444-4444-444444444444',
    (SELECT id FROM auth.users LIMIT 1),
    'Dimas Prasetyo',
    'Singles specialist with focus on court movement, deception, and mental game. Excellent for intermediate to advanced players looking to refine their singles strategy.',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop',
    ARRAY['Singles Strategy', 'Court Movement', 'Mental Game'],
    'professional',
    12,
    ARRAY['National Singles Runner-up 2018', 'BWF Level 3 Coach', 'Sports Psychology Certificate'],
    'Jakarta',
    'Jakarta Pusat',
    180000,
    4.9,
    142,
    118,
    true,
    true
),
-- Coach 5: Women's Coach
(
    '55555555-5555-5555-5555-555555555555',
    (SELECT id FROM auth.users LIMIT 1),
    'Maya Anggraini',
    'Specialized in coaching women and mixed doubles. Focuses on technique refinement, strategic play, and building confidence on court.',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop',
    ARRAY['Mixed Doubles', 'Women\'s Singles', 'Technical Refinement'],
    'advanced',
    10,
    ARRAY['SEA Games Bronze Medalist', 'BWF Level 2 Coach', 'National Team Assistant Coach'],
    'Bandung',
    'Bandung Selatan',
    140000,
    4.8,
    96,
    84,
    true,
    true
)
ON CONFLICT (id) DO NOTHING;

-- Sample Availability Slots
-- Coach 1 (Budi Santoso) - Available Mon, Wed, Fri evenings & Sat/Sun mornings
INSERT INTO public.coach_availability_slots (coach_id, day_of_week, start_time, end_time, is_available) VALUES
('11111111-1111-1111-1111-111111111111', 1, '17:00', '20:00', true), -- Monday
('11111111-1111-1111-1111-111111111111', 3, '17:00', '20:00', true), -- Wednesday
('11111111-1111-1111-1111-111111111111', 5, '17:00', '20:00', true), -- Friday
('11111111-1111-1111-1111-111111111111', 6, '08:00', '12:00', true), -- Saturday
('11111111-1111-1111-1111-111111111111', 0, '08:00', '12:00', true)  -- Sunday
ON CONFLICT (coach_id, day_of_week, start_time) DO NOTHING;

-- Coach 2 (Siti Rahmawati) - Available weekday afternoons & Saturday mornings
INSERT INTO public.coach_availability_slots (coach_id, day_of_week, start_time, end_time, is_available) VALUES
('22222222-2222-2222-2222-222222222222', 1, '14:00', '18:00', true), -- Monday
('22222222-2222-2222-2222-222222222222', 2, '14:00', '18:00', true), -- Tuesday
('22222222-2222-2222-2222-222222222222', 3, '14:00', '18:00', true), -- Wednesday
('22222222-2222-2222-2222-222222222222', 4, '14:00', '18:00', true), -- Thursday
('22222222-2222-2222-2222-222222222222', 5, '14:00', '18:00', true), -- Friday
('22222222-2222-2222-2222-222222222222', 6, '09:00', '13:00', true)  -- Saturday
ON CONFLICT (coach_id, day_of_week, start_time) DO NOTHING;

-- Coach 3 (Rizky Firmansyah) - Available Tue, Thu, Sat evenings
INSERT INTO public.coach_availability_slots (coach_id, day_of_week, start_time, end_time, is_available) VALUES
('33333333-3333-3333-3333-333333333333', 2, '18:00', '21:00', true), -- Tuesday
('33333333-3333-3333-3333-333333333333', 4, '18:00', '21:00', true), -- Thursday
('33333333-3333-3333-3333-333333333333', 6, '15:00', '19:00', true)  -- Saturday
ON CONFLICT (coach_id, day_of_week, start_time) DO NOTHING;

-- Coach 4 (Dimas Prasetyo) - Very busy, limited slots
INSERT INTO public.coach_availability_slots (coach_id, day_of_week, start_time, end_time, is_available) VALUES
('44444444-4444-4444-4444-444444444444', 3, '18:00', '21:00', true), -- Wednesday
('44444444-4444-4444-4444-444444444444', 6, '10:00', '14:00', true), -- Saturday
('44444444-4444-4444-4444-444444444444', 0, '10:00', '14:00', true)  -- Sunday
ON CONFLICT (coach_id, day_of_week, start_time) DO NOTHING;

-- Coach 5 (Maya Anggraini) - Morning and afternoon slots
INSERT INTO public.coach_availability_slots (coach_id, day_of_week, start_time, end_time, is_available) VALUES
('55555555-5555-5555-5555-555555555555', 1, '09:00', '12:00', true), -- Monday morning
('55555555-5555-5555-5555-555555555555', 1, '15:00', '18:00', true), -- Monday afternoon
('55555555-5555-5555-5555-555555555555', 3, '09:00', '12:00', true), -- Wednesday morning
('55555555-5555-5555-5555-555555555555', 3, '15:00', '18:00', true), -- Wednesday afternoon
('55555555-5555-5555-5555-555555555555', 5, '09:00', '12:00', true), -- Friday morning
('55555555-5555-5555-5555-555555555555', 6, '08:00', '16:00', true)  -- Saturday all day
ON CONFLICT (coach_id, day_of_week, start_time) DO NOTHING;
