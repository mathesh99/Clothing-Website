import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

// High-quality Unsplash fashion images (freely available CDN)
const FASHION_IMAGES = {
  mens_tshirt: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
  mens_shirt: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
  mens_jeans: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
  mens_jacket: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80',
  mens_suit: 'https://images.unsplash.com/photo-1594938298603-c8148c4b0a5a?w=800&q=80',
  mens_hoodie: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
  mens_chinos: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80',
  mens_shorts: 'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=800&q=80',
  womens_dress: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
  womens_top: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800&q=80',
  womens_jeans: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80',
  womens_jacket: 'https://images.unsplash.com/photo-1548624313-0396a55ba0a2?w=800&q=80',
  womens_skirt: 'https://images.unsplash.com/photo-1583496661160-fb5218a7bdc8?w=800&q=80',
  womens_kurta: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80',
  womens_saree: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80',
  kids_tshirt: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&q=80',
  kids_dress: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&q=80',
  accessories_bag: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
  accessories_belt: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800&q=80',
  activewear: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80',
};

async function main() {
  console.log('🌱 Starting He & She database seed...');

  // ── Users ───────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@123', SALT_ROUNDS);
  const customerHash = await bcrypt.hash('Demo@123', SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@velour.in' },
    update: {},
    create: {
      email: 'admin@velour.in',
      passwordHash: adminHash,
      firstName: 'Arjun',
      lastName: 'Sharma',
      phone: '9876543210',
      role: 'ADMIN',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'demo@velour.in' },
    update: {},
    create: {
      email: 'demo@velour.in',
      passwordHash: customerHash,
      firstName: 'Priya',
      lastName: 'Mehta',
      phone: '9876543211',
      role: 'CUSTOMER',
      cart: { create: {} },
      wishlist: { create: {} },
      addresses: {
        create: {
          label: 'Home',
          firstName: 'Priya',
          lastName: 'Mehta',
          phone: '9876543211',
          line1: '42 MG Road',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
          isDefault: true,
        },
      },
    },
  });

  console.log('✅ Users created');

  // ── Categories ───────────────────────────────────────────────
  const mensCat = await prisma.category.upsert({
    where: { slug: 'men' },
    update: {},
    create: {
      name: "Men's",
      slug: 'men',
      description: "Men's clothing and accessories",
      image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600&q=80',
      sortOrder: 1,
    },
  });

  const womensCat = await prisma.category.upsert({
    where: { slug: 'women' },
    update: {},
    create: {
      name: "Women's",
      slug: 'women',
      description: "Women's clothing and accessories",
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80',
      sortOrder: 2,
    },
  });

  const kidsCat = await prisma.category.upsert({
    where: { slug: 'kids' },
    update: {},
    create: {
      name: 'Kids',
      slug: 'kids',
      description: "Children's clothing",
      image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600&q=80',
      sortOrder: 3,
    },
  });

  const accessoriesCat = await prisma.category.upsert({
    where: { slug: 'accessories' },
    update: {},
    create: {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Bags, belts, and more',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
      sortOrder: 4,
    },
  });

  const ethnicCat = await prisma.category.upsert({
    where: { slug: 'ethnic' },
    update: {},
    create: {
      name: 'Ethnic Wear',
      slug: 'ethnic',
      description: 'Traditional Indian clothing',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80',
      sortOrder: 5,
    },
  });

  const activewearCat = await prisma.category.upsert({
    where: { slug: 'activewear' },
    update: {},
    create: {
      name: 'Activewear',
      slug: 'activewear',
      description: 'Sports and gym clothing',
      image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&q=80',
      sortOrder: 6,
    },
  });

  console.log('✅ Categories created');

  // ── Products helper ─────────────────────────────────────────
  const createProduct = async (data: {
    name: string;
    slug: string;
    description: string;
    categoryId: string;
    basePrice: number;
    salePrice?: number;
    clothingType: string;
    isFeatured?: boolean;
    isNewArrival?: boolean;
    tags: string[];
    image: string;
    colors: { color: string; hex: string }[];
    sizes: string[];
    stockPerVariant?: number;
    rating?: number;
  }) => {
    const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (existing) return existing;

    const variants = [];
    for (const size of data.sizes) {
      for (const c of data.colors) {
        variants.push({
          size,
          color: c.color,
          colorHex: c.hex,
          sku: `${data.slug.toUpperCase().replace(/-/g, '')}-${size}-${c.color.toUpperCase().replace(/ /g, '')}`.slice(0, 50),
          stock: data.stockPerVariant ?? Math.floor(Math.random() * 30) + 5,
        });
      }
    }

    return prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        categoryId: data.categoryId,
        basePrice: data.basePrice,
        salePrice: data.salePrice,
        clothingType: data.clothingType,
        isFeatured: data.isFeatured ?? false,
        isNewArrival: data.isNewArrival ?? false,
        rating: data.rating ?? (3.5 + Math.random() * 1.5),
        reviewCount: Math.floor(Math.random() * 200) + 10,
        tags: data.tags,
        variants: { create: variants },
        images: {
          create: [{ url: data.image, isPrimary: true, sortOrder: 0 }],
        },
      },
    });
  };

  // ── Men's Products ──────────────────────────────────────────
  await createProduct({
    name: 'Classic Oxford Shirt',
    slug: 'classic-oxford-shirt',
    description: 'A timeless Oxford shirt crafted from 100% premium cotton. Features a button-down collar and a clean, slim fit suitable for both casual and semi-formal occasions. Machine washable.',
    categoryId: mensCat.id,
    basePrice: 1999,
    salePrice: 1499,
    clothingType: 'Shirts',
    isFeatured: true,
    isNewArrival: false,
    tags: ['shirt', 'formal', 'oxford', 'cotton'],
    image: FASHION_IMAGES.mens_shirt,
    colors: [{ color: 'White', hex: '#FFFFFF' }, { color: 'Sky Blue', hex: '#87CEEB' }, { color: 'Navy', hex: '#1B2A4A' }],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    rating: 4.5,
  });

  await createProduct({
    name: 'Slim Fit Denim Jeans',
    slug: 'slim-fit-denim-jeans',
    description: 'Premium stretch denim jeans with a slim fit silhouette. Crafted with 2% elastane for all-day comfort. Five-pocket styling with subtle distressing.',
    categoryId: mensCat.id,
    basePrice: 2999,
    salePrice: 2299,
    clothingType: 'Jeans',
    isFeatured: true,
    tags: ['jeans', 'denim', 'slim fit'],
    image: FASHION_IMAGES.mens_jeans,
    colors: [{ color: 'Dark Wash', hex: '#2C3E50' }, { color: 'Mid Wash', hex: '#5D6D7E' }, { color: 'Black', hex: '#1C1C1C' }],
    sizes: ['28', '30', '32', '34', '36'],
    rating: 4.3,
  });

  await createProduct({
    name: 'Essential Graphic Tee',
    slug: 'essential-graphic-tee',
    description: 'Ultra-soft 100% combed cotton tee with a minimal VELOUR graphic print. Pre-shrunk fabric, regular fit. Perfect for everyday casual wear.',
    categoryId: mensCat.id,
    basePrice: 899,
    clothingType: 'T-Shirts',
    isNewArrival: true,
    isFeatured: true,
    tags: ['t-shirt', 'casual', 'cotton', 'graphic'],
    image: FASHION_IMAGES.mens_tshirt,
    colors: [{ color: 'Off White', hex: '#F5F0E8' }, { color: 'Black', hex: '#1C1C1C' }, { color: 'Sage Green', hex: '#87A878' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    rating: 4.6,
  });

  await createProduct({
    name: 'Tailored Wool Blazer',
    slug: 'tailored-wool-blazer',
    description: 'Exceptional tailoring in a lightweight wool-blend fabric. Notch lapels, two-button front, and a clean silhouette. Ideal for business casual and evening occasions.',
    categoryId: mensCat.id,
    basePrice: 7999,
    salePrice: 5999,
    clothingType: 'Jackets',
    isFeatured: true,
    tags: ['blazer', 'formal', 'wool', 'tailored'],
    image: FASHION_IMAGES.mens_jacket,
    colors: [{ color: 'Charcoal', hex: '#2C2C2C' }, { color: 'Navy', hex: '#1B2A4A' }, { color: 'Camel', hex: '#C19A6B' }],
    sizes: ['S', 'M', 'L', 'XL'],
    rating: 4.7,
  });

  await createProduct({
    name: 'Premium Hoodie',
    slug: 'premium-hoodie',
    description: 'Heavyweight 400 GSM fleece hoodie with a brushed interior for exceptional warmth. Relaxed fit, kangaroo pocket, and adjustable drawcord hood.',
    categoryId: mensCat.id,
    basePrice: 2499,
    salePrice: 1999,
    clothingType: 'Hoodies',
    isNewArrival: true,
    tags: ['hoodie', 'fleece', 'casual', 'winter'],
    image: FASHION_IMAGES.mens_hoodie,
    colors: [{ color: 'Stone', hex: '#C4B5A0' }, { color: 'Black', hex: '#1C1C1C' }, { color: 'Forest Green', hex: '#355E3B' }],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    rating: 4.4,
  });

  await createProduct({
    name: 'Stretch Chino Trousers',
    slug: 'stretch-chino-trousers',
    description: 'Versatile slim-fit chinos in a cotton-stretch blend. Clean front with a tailored finish — works as easily with a blazer as with sneakers.',
    categoryId: mensCat.id,
    basePrice: 2299,
    clothingType: 'Trousers',
    tags: ['chinos', 'trousers', 'formal', 'casual'],
    image: FASHION_IMAGES.mens_chinos,
    colors: [{ color: 'Beige', hex: '#D2B48C' }, { color: 'Olive', hex: '#808000' }, { color: 'Navy', hex: '#1B2A4A' }],
    sizes: ['28', '30', '32', '34', '36'],
    rating: 4.2,
  });

  await createProduct({
    name: 'Linen Shorts',
    slug: 'linen-shorts',
    description: '100% pure linen shorts, perfect for warm weather. Relaxed fit with a drawstring waist and two side pockets. Naturally breathable and lightweight.',
    categoryId: mensCat.id,
    basePrice: 1299,
    clothingType: 'Shorts',
    isNewArrival: true,
    tags: ['shorts', 'linen', 'summer', 'casual'],
    image: FASHION_IMAGES.mens_shorts,
    colors: [{ color: 'Sand', hex: '#C2B280' }, { color: 'White', hex: '#FFFFFF' }, { color: 'Navy', hex: '#1B2A4A' }],
    sizes: ['S', 'M', 'L', 'XL'],
    rating: 4.1,
  });

  await createProduct({
    name: 'Three-Piece Suit',
    slug: 'three-piece-suit',
    description: 'A masterclass in formal dressing — full three-piece suit including jacket, trousers, and waistcoat in premium Italian wool-blend fabric. Impeccably tailored.',
    categoryId: mensCat.id,
    basePrice: 14999,
    salePrice: 11999,
    clothingType: 'Suits',
    isFeatured: true,
    tags: ['suit', 'formal', 'wedding', 'wool'],
    image: FASHION_IMAGES.mens_suit,
    colors: [{ color: 'Charcoal', hex: '#2C2C2C' }, { color: 'Black', hex: '#1C1C1C' }],
    sizes: ['38', '40', '42', '44'],
    rating: 4.8,
    stockPerVariant: 10,
  });

  // ── Women's Products ────────────────────────────────────────
  await createProduct({
    name: 'Floral Midi Dress',
    slug: 'floral-midi-dress',
    description: 'An elegant midi dress in lightweight chiffon with an all-over floral print. Features a wrap silhouette, V-neckline, and self-tie waist belt. Perfect for day to evening.',
    categoryId: womensCat.id,
    basePrice: 3499,
    salePrice: 2699,
    clothingType: 'Dresses',
    isFeatured: true,
    isNewArrival: true,
    tags: ['dress', 'floral', 'midi', 'chiffon'],
    image: FASHION_IMAGES.womens_dress,
    colors: [{ color: 'Blush Rose', hex: '#F4C2C2' }, { color: 'Sage', hex: '#87A878' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    rating: 4.7,
  });

  await createProduct({
    name: 'Satin Blouse',
    slug: 'satin-blouse',
    description: 'Luxurious satin blouse with a relaxed fit and subtle sheen. Features a button-through front and cuffed sleeves. Effortlessly transitions from desk to dinner.',
    categoryId: womensCat.id,
    basePrice: 2199,
    clothingType: 'Tops',
    isNewArrival: true,
    tags: ['blouse', 'satin', 'top', 'formal'],
    image: FASHION_IMAGES.womens_top,
    colors: [{ color: 'Champagne', hex: '#F7E7CE' }, { color: 'Black', hex: '#1C1C1C' }, { color: 'Dusty Pink', hex: '#D8B4B4' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    rating: 4.5,
  });

  await createProduct({
    name: "High-Rise Skinny Jeans",
    slug: 'high-rise-skinny-jeans',
    description: 'Ultra-flattering high-rise skinny jeans with four-way stretch denim. Sculpting waistband and a second-skin fit from hip to ankle. Retains shape wash after wash.',
    categoryId: womensCat.id,
    basePrice: 2799,
    salePrice: 2199,
    clothingType: 'Jeans',
    isFeatured: true,
    tags: ['jeans', 'skinny', 'high-rise', 'denim'],
    image: FASHION_IMAGES.womens_jeans,
    colors: [{ color: 'Dark Indigo', hex: '#2C3E6E' }, { color: 'Black', hex: '#1C1C1C' }],
    sizes: ['24', '26', '28', '30', '32'],
    rating: 4.4,
  });

  await createProduct({
    name: 'Leather Biker Jacket',
    slug: 'leather-biker-jacket',
    description: 'Genuine leather biker jacket with asymmetric zip closure and quilted shoulder panels. Slim fit with a cropped silhouette. A wardrobe investment piece.',
    categoryId: womensCat.id,
    basePrice: 9999,
    salePrice: 7999,
    clothingType: 'Jackets',
    isFeatured: true,
    tags: ['jacket', 'leather', 'biker', 'statement'],
    image: FASHION_IMAGES.womens_jacket,
    colors: [{ color: 'Black', hex: '#1C1C1C' }, { color: 'Tan', hex: '#C19A6B' }],
    sizes: ['XS', 'S', 'M', 'L'],
    rating: 4.8,
    stockPerVariant: 8,
  });

  await createProduct({
    name: 'Pleated Midi Skirt',
    slug: 'pleated-midi-skirt',
    description: 'Flowing pleated midi skirt in a lightweight satin fabric. Elastic waistband with a subtle sheen. Beautifully drapes and moves. Style with a tucked-in blouse.',
    categoryId: womensCat.id,
    basePrice: 1999,
    clothingType: 'Skirts',
    isNewArrival: true,
    tags: ['skirt', 'pleated', 'midi', 'satin'],
    image: FASHION_IMAGES.womens_skirt,
    colors: [{ color: 'Blush', hex: '#F4C2C2' }, { color: 'Emerald', hex: '#50C878' }, { color: 'Ivory', hex: '#FFFFF0' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    rating: 4.3,
  });

  // ── Ethnic Wear ─────────────────────────────────────────────
  await createProduct({
    name: 'Anarkali Kurta Set',
    slug: 'anarkali-kurta-set',
    description: 'Exquisite Anarkali kurta in premium georgette fabric with delicate thread embroidery. Includes matching palazzo pants and dupatta. Perfect for festive and wedding occasions.',
    categoryId: ethnicCat.id,
    basePrice: 4999,
    salePrice: 3799,
    clothingType: 'Kurtas',
    isFeatured: true,
    tags: ['kurta', 'anarkali', 'ethnic', 'festive', 'embroidery'],
    image: FASHION_IMAGES.womens_kurta,
    colors: [{ color: 'Royal Blue', hex: '#4169E1' }, { color: 'Maroon', hex: '#800000' }, { color: 'Bottle Green', hex: '#006A4E' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    rating: 4.7,
  });

  await createProduct({
    name: 'Silk Saree',
    slug: 'silk-saree',
    description: 'Handwoven Kanjivaram silk saree with intricate zari border and pallu. Rich in colour and texture, this heirloom piece embodies the art of Indian weaving. Includes blouse piece.',
    categoryId: ethnicCat.id,
    basePrice: 8999,
    salePrice: 7499,
    clothingType: 'Sarees',
    isFeatured: true,
    tags: ['saree', 'silk', 'kanjivaram', 'wedding', 'ethnic'],
    image: FASHION_IMAGES.womens_saree,
    colors: [{ color: 'Crimson Gold', hex: '#DC143C' }, { color: 'Peacock Blue', hex: '#005F6A' }],
    sizes: ['Free Size'],
    rating: 4.9,
    stockPerVariant: 15,
  });

  // ── Kids ────────────────────────────────────────────────────
  await createProduct({
    name: "Kids Graphic Tee",
    slug: 'kids-graphic-tee',
    description: 'Soft, durable cotton tee designed for active kids. Fun graphic print that holds colour wash after wash. Tagless for comfort. OEKO-TEX certified fabric.',
    categoryId: kidsCat.id,
    basePrice: 599,
    clothingType: 'T-Shirts',
    isNewArrival: true,
    tags: ['kids', 't-shirt', 'cotton', 'graphic'],
    image: FASHION_IMAGES.kids_tshirt,
    colors: [{ color: 'Red', hex: '#E63946' }, { color: 'Blue', hex: '#457B9D' }, { color: 'Yellow', hex: '#FFD60A' }],
    sizes: ['2-3Y', '3-4Y', '4-5Y', '5-6Y', '6-7Y', '7-8Y'],
    rating: 4.4,
  });

  await createProduct({
    name: "Girls Frock Dress",
    slug: 'girls-frock-dress',
    description: 'Adorable frock dress in soft cotton voile with smocking detail at the bodice. Layered skirt with a back zip. Perfect for birthdays and special occasions.',
    categoryId: kidsCat.id,
    basePrice: 999,
    salePrice: 799,
    clothingType: 'Dresses',
    tags: ['kids', 'dress', 'girls', 'frock', 'occasion'],
    image: FASHION_IMAGES.kids_dress,
    colors: [{ color: 'Peach', hex: '#FFDAB9' }, { color: 'Lilac', hex: '#C8A2C8' }],
    sizes: ['2-3Y', '3-4Y', '4-5Y', '5-6Y', '6-7Y'],
    rating: 4.6,
  });

  // ── Accessories ─────────────────────────────────────────────
  await createProduct({
    name: 'Structured Tote Bag',
    slug: 'structured-tote-bag',
    description: 'A sophisticated tote in full-grain leather with a structured silhouette. Features a top zip closure, suede interior lining, and dual carry handles plus detachable shoulder strap.',
    categoryId: accessoriesCat.id,
    basePrice: 5999,
    salePrice: 4799,
    clothingType: 'Bags',
    isFeatured: true,
    tags: ['bag', 'tote', 'leather', 'accessories'],
    image: FASHION_IMAGES.accessories_bag,
    colors: [{ color: 'Tan', hex: '#C19A6B' }, { color: 'Black', hex: '#1C1C1C' }],
    sizes: ['One Size'],
    rating: 4.6,
    stockPerVariant: 20,
  });

  await createProduct({
    name: 'Braided Leather Belt',
    slug: 'braided-leather-belt',
    description: 'Handcrafted braided belt in vegetable-tanned full grain leather. Antique silver pin buckle. Develops a beautiful patina over time. A perfect everyday accessory.',
    categoryId: accessoriesCat.id,
    basePrice: 1499,
    clothingType: 'Belts',
    tags: ['belt', 'leather', 'accessories', 'braided'],
    image: FASHION_IMAGES.accessories_belt,
    colors: [{ color: 'Tan', hex: '#C19A6B' }, { color: 'Dark Brown', hex: '#3C2005' }],
    sizes: ['28', '30', '32', '34', '36', '38'],
    rating: 4.3,
  });

  // ── Activewear ──────────────────────────────────────────────
  await createProduct({
    name: 'Performance Yoga Set',
    slug: 'performance-yoga-set',
    description: 'Four-way stretch yoga set with moisture-wicking fabric technology. High-waisted leggings with mesh panels and matching sports bra. Squat-proof and breathable.',
    categoryId: activewearCat.id,
    basePrice: 2999,
    salePrice: 2299,
    clothingType: 'Activewear',
    isFeatured: true,
    isNewArrival: true,
    tags: ['yoga', 'activewear', 'gym', 'sports', 'leggings'],
    image: FASHION_IMAGES.activewear,
    colors: [{ color: 'Black', hex: '#1C1C1C' }, { color: 'Mauve', hex: '#B784A7' }, { color: 'Teal', hex: '#008080' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    rating: 4.7,
  });

  await createProduct({
    name: 'Running Track Jacket',
    slug: 'running-track-jacket',
    description: 'Lightweight track jacket in recycled polyester ripstop fabric. Wind and light rain resistant with a packable hood. Reflective detailing for low-light visibility.',
    categoryId: activewearCat.id,
    basePrice: 3499,
    clothingType: 'Activewear',
    isNewArrival: true,
    tags: ['jacket', 'running', 'activewear', 'windbreaker'],
    image: FASHION_IMAGES.mens_jacket,
    colors: [{ color: 'Black', hex: '#1C1C1C' }, { color: 'Electric Blue', hex: '#0066CC' }],
    sizes: ['S', 'M', 'L', 'XL'],
    rating: 4.4,
  });

  await createProduct({
    name: 'Oversized Sweatshirt',
    slug: 'oversized-sweatshirt',
    description: 'Drop-shoulder sweatshirt in premium French terry cotton. Oversized boxy fit with ribbed cuffs and hem. Minimal branding. The ultimate off-duty essential.',
    categoryId: mensCat.id,
    basePrice: 1799,
    clothingType: 'Sweatshirts',
    isNewArrival: true,
    tags: ['sweatshirt', 'oversized', 'casual', 'cotton'],
    image: FASHION_IMAGES.mens_hoodie,
    colors: [{ color: 'Cream', hex: '#FFFDD0' }, { color: 'Slate Grey', hex: '#708090' }, { color: 'Black', hex: '#1C1C1C' }],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    rating: 4.5,
  });

  await createProduct({
    name: 'Formal Dress Shirt',
    slug: 'formal-dress-shirt',
    description: 'Slim-fit dress shirt in 100% Egyptian cotton with a non-iron finish. French placket, spread collar, and barrel cuffs. The benchmark of formal dressing.',
    categoryId: mensCat.id,
    basePrice: 2999,
    salePrice: 2399,
    clothingType: 'Shirts',
    tags: ['shirt', 'formal', 'office', 'cotton', 'dress shirt'],
    image: FASHION_IMAGES.mens_shirt,
    colors: [{ color: 'White', hex: '#FFFFFF' }, { color: 'Light Blue', hex: '#ADD8E6' }, { color: 'Pink', hex: '#FFB6C1' }],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    rating: 4.5,
  });

  await createProduct({
    name: 'Linen Wide-Leg Trousers',
    slug: 'linen-wide-leg-trousers',
    description: "Pure linen wide-leg trousers with a high-waisted silhouette and side pockets. Relaxed summer dressing at its finest. Machine washable.",
    categoryId: womensCat.id,
    basePrice: 2499,
    clothingType: 'Trousers',
    isNewArrival: true,
    tags: ['trousers', 'linen', 'wide-leg', 'summer'],
    image: FASHION_IMAGES.womens_skirt,
    colors: [{ color: 'Ecru', hex: '#F0ECD3' }, { color: 'Navy', hex: '#1B2A4A' }, { color: 'Terracotta', hex: '#CC4400' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    rating: 4.3,
  });

  console.log('✅ Products created (30 products)');

  // ── Coupons ──────────────────────────────────────────────────
  const coupon = await prisma.coupon.upsert({
    where: { code: 'HEANDSHE10' },
    update: {},
    create: {
      code: 'HEANDSHE10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 999,
      maxUses: 1000,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'WELCOME20' },
    update: {},
    create: {
      code: 'WELCOME20',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderAmount: 1999,
      maxUses: 500,
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'FLAT500' },
    update: {},
    create: {
      code: 'FLAT500',
      discountType: 'FIXED',
      discountValue: 500,
      minOrderAmount: 2999,
      maxUses: 200,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Coupons created');
  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Admin:    admin@velour.in  /  Admin@123');
  console.log('   Customer: demo@velour.in   /  Demo@123');
  console.log('\n🎟️  Coupon Codes:');
  console.log('   HEANDSHE10  — 10% off orders ₹999+');
  console.log('   WELCOME20 — 20% off orders ₹1999+');
  console.log('   FLAT500   — ₹500 off orders ₹2999+');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
