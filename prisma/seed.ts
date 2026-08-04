import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function slugify(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const categories = ['CDs', 'Vinyl', 'Posters', 'T-Shirts', 'Mugs', 'Coffee', 'Tea'];

const productsByCategory: Record<string, { name: string; description: string; priceCents: number; stock: number }[]> = {
  CDs: [
    { name: 'CD - Urban Echoes (Rock)', description: 'Studio album, 12 tracks.', priceCents: 4990, stock: 25 },
    { name: 'CD - Vinyl Nights (Jazz)', description: 'Instrumental jazz collection.', priceCents: 5490, stock: 15 },
    { name: 'CD - Synth Dreams (Electronic)', description: 'Original electronic album.', priceCents: 4490, stock: 20 },
  ],
  Vinyl: [
    { name: 'Vinyl - Urban Echoes (Special Edition)', description: '180g, gatefold sleeve.', priceCents: 12990, stock: 10 },
    { name: 'Vinyl - Blues Classics', description: 'Remastered reissue.', priceCents: 14990, stock: 8 },
    { name: 'Vinyl - Acoustic Sessions', description: 'Live studio recording.', priceCents: 11990, stock: 12 },
  ],
  Posters: [
    { name: 'Poster - Urban Echoes Tour 2025', description: 'A2, matte paper.', priceCents: 3990, stock: 30 },
    { name: 'Poster - Rock Legend', description: 'A2, limited edition.', priceCents: 4490, stock: 18 },
    { name: 'Poster - Jazz Festival', description: 'A3, glossy finish.', priceCents: 2990, stock: 22 },
  ],
  'T-Shirts': [
    { name: 'T-Shirt - Urban Echoes Logo', description: '100% cotton, unisex.', priceCents: 5990, stock: 40 },
    { name: 'T-Shirt - Vintage Tour', description: 'Faded print, unisex.', priceCents: 6490, stock: 35 },
    { name: 'T-Shirt - Music Notes', description: 'Minimalist print.', priceCents: 5490, stock: 28 },
  ],
  Mugs: [
    { name: 'Mug - Vinyl Record', description: 'Ceramic, 325ml.', priceCents: 3490, stock: 50 },
    { name: 'Mug - Urban Echoes', description: 'Ceramic, 300ml, band logo.', priceCents: 3290, stock: 45 },
    { name: 'Mug - Music Note', description: 'Ceramic, color-changing with heat.', priceCents: 3990, stock: 20 },
  ],
  Coffee: [
    { name: 'Espresso', description: 'Single shot, medium roast beans.', priceCents: 690, stock: 200 },
    { name: 'Filter Coffee 300ml', description: 'Freshly brewed filter coffee.', priceCents: 990, stock: 200 },
    { name: 'Coffee Beans Bag 250g', description: 'Medium roast, house blend.', priceCents: 3290, stock: 60 },
  ],
  Tea: [
    { name: 'Chamomile Tea', description: 'Cup, 300ml.', priceCents: 790, stock: 150 },
    { name: 'Green Tea', description: 'Cup, 300ml.', priceCents: 790, stock: 150 },
    { name: 'Iced Berry Tea', description: 'Cup, 400ml.', priceCents: 990, stock: 100 },
  ],
};

async function main() {
  const categoryRecords = await Promise.all(
    categories.map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: { name, slug: slugify(name) },
      }),
    ),
  );

  const categoryIdByName = new Map(categoryRecords.map((c) => [c.name, c.id]));

  for (const [categoryName, products] of Object.entries(productsByCategory)) {
    const categoryId = categoryIdByName.get(categoryName);
    if (!categoryId) continue;

    for (const product of products) {
      const existing = await prisma.product.findFirst({ where: { name: product.name } });
      if (existing) continue;
      await prisma.product.create({ data: { ...product, categoryId } });
    }
  }

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@musicandcoffee.com' },
    update: {},
    create: {
      name: 'Store Admin',
      email: 'admin@musicandcoffee.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      cart: { create: {} },
    },
  });

  const customerPasswordHash = await bcrypt.hash('customer123', 10);
  await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      name: 'Test Customer',
      email: 'customer@example.com',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      cart: { create: {} },
    },
  });

  console.log('Seed completed successfully.');
  console.log('Admin: admin@musicandcoffee.com / admin123');
  console.log('Customer: customer@example.com / customer123');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
