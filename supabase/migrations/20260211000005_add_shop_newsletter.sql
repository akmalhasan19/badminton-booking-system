-- Create products and newsletter_subscribers tables for shop feature

-- ============================================
-- Table: products
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Racket', 'Shoes', 'Apparel', 'Accessory')),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_new BOOLEAN DEFAULT false NOT NULL,
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- Table: newsletter_subscribers
-- ============================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  source TEXT, -- Track where they subscribed from ('shop_page', 'homepage', etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_new ON public.products(is_new);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON public.newsletter_subscribers(is_active);

-- ============================================
-- Triggers
-- ============================================
CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Anyone can view active products"
  ON public.products
  FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins can insert products"
  ON public.products
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update products"
  ON public.products
  FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete products"
  ON public.products
  FOR DELETE
  USING (is_admin());

-- Newsletter subscribers policies
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all subscribers"
  ON public.newsletter_subscribers
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update subscribers"
  ON public.newsletter_subscribers
  FOR UPDATE
  USING (is_admin());

-- ============================================
-- Seed Data - Sample Products
-- ============================================
INSERT INTO public.products (name, description, category, price, image_url, is_active, is_new, stock_quantity) VALUES
-- Rackets
(
  'Yonex Astrox 99 Pro',
  'Professional-grade racket with extra head weight for powerful smashes. Used by world champions.',
  'Racket',
  299.99,
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1000&auto=format&fit=crop',
  true,
  true,
  15
),
(
  'Victor Thruster K 9900',
  'Lightweight offensive racket with superior control and speed. Perfect for aggressive players.',
  'Racket',
  279.99,
  'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?q=80&w=1000&auto=format&fit=crop',
  true,
  false,
  20
),
(
  'Li-Ning Turbo Charging 75',
  'All-around racket with balanced weight distribution. Ideal for intermediate players.',
  'Racket',
  189.99,
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1000&auto=format&fit=crop',
  true,
  false,
  30
),

-- Shoes
(
  'Yonex Power Cushion 65Z3',
  'Lightweight court shoes with exceptional cushioning and lateral support.',
  'Shoes',
  149.99,
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop',
  true,
  true,
  50
),
(
  'Victor SH-A960',
  'Professional-grade shoes with carbon fiber plate for enhanced stability.',
  'Shoes',
  169.99,
  'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1000&auto=format&fit=crop',
  true,
  false,
  40
),

-- Apparel
(
  'Smash Tournament Jersey',
  'Breathable performance jersey with moisture-wicking technology. Official tournament approved.',
  'Apparel',
  49.99,
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop',
  true,
  true,
  100
),
(
  'Pro Player Shorts',
  'Lightweight shorts with 4-way stretch for maximum mobility.',
  'Apparel',
  39.99,
  'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=1000&auto=format&fit=crop',
  true,
  false,
  120
),
(
  'Court Compression Shirt',
  'Form-fitting compression wear for muscle support and recovery.',
  'Apparel',
  44.99,
  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop',
  true,
  false,
  80
),

-- Accessories
(
  'Premium Racket Bag',
  'Spacious bag with thermal compartments. Fits up to 6 rackets.',
  'Accessory',
  79.99,
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop',
  true,
  false,
  25
),
(
  'Pro Overgrips (3-Pack)',
  'Tacky overgrips for enhanced grip and sweat absorption.',
  'Accessory',
  12.99,
  'https://images.unsplash.com/photo-1622290291468-a28f7a7e82e8?q=80&w=1000&auto=format&fit=crop',
  true,
  false,
  200
),
(
  'Court Wristbands (Pair)',
  'Absorbent wristbands to keep hands dry during intense matches.',
  'Accessory',
  9.99,
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000&auto=format&fit=crop',
  true,
  true,
  150
),
(
  'Shuttlecock Tube (12pcs)',
  'Professional tournament-grade feather shuttlecocks.',
  'Accessory',
  29.99,
  'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?q=80&w=1000&auto=format&fit=crop',
  true,
  false,
  60
)
ON CONFLICT (id) DO NOTHING;
