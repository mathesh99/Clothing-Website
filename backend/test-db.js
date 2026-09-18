const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const start = Date.now();
prisma.product.findMany({
  take: 20,
  relationLoadStrategy: 'join',
  include: {
    images: { where: { isPrimary: true }, take: 1 },
    category: { select: { name: true, slug: true } },
    variants: {
      select: { size: true, color: true, colorHex: true, stock: true, priceAddon: true },
    },
    _count: { select: { reviews: true } },
  }
}).then(c => console.log('Items:', c.length, 'Time:', Date.now() - start, 'ms')).finally(() => prisma.$disconnect());
