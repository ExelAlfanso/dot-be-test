import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log('🔄 Connecting to database...');

    // Delete existing data (in correct order due to foreign keys)
    await prisma.inventoryMovement.deleteMany();
    console.log('✅ Old inventory movements deleted');

    await prisma.product.deleteMany();
    console.log('✅ Old products deleted');

    await prisma.user.deleteMany();
    console.log('✅ Old users deleted');

    // Hash passwords
    const hashedPassword1 = await bcrypt.hash('password123', 10);
    const hashedPassword2 = await bcrypt.hash('admin123', 10);

    // Create dummy users
    const user1 = await prisma.user.create({
      data: {
        email: 'user@test.com',
        username: 'testuser',
        password: hashedPassword1,
        role: 'USER',
      },
    });

    const user2 = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        username: 'admin',
        password: hashedPassword2,
        role: 'ADMIN',
      },
    });

    console.log('✅ Users created');

    // Create dummy products
    const products = await prisma.product.createMany({
      data: [
        {
          name: 'Laptop Pro 15"',
          description: 'High-performance laptop for professionals',
          price: 1299.99,
          stock: 25,
          createdBy: user1.id,
        },
        {
          name: 'Wireless Mouse',
          description: 'Ergonomic wireless mouse with 6 buttons',
          price: 29.99,
          stock: 150,
          createdBy: user1.id,
        },
        {
          name: 'Mechanical Keyboard',
          description: 'RGB mechanical keyboard with blue switches',
          price: 89.99,
          stock: 75,
          createdBy: user2.id,
        },
        {
          name: '4K Monitor 27"',
          description: 'Ultra HD monitor with HDR support',
          price: 449.99,
          stock: 40,
          createdBy: user2.id,
        },
        {
          name: 'USB-C Hub',
          description: '7-in-1 USB-C hub with HDMI and ethernet',
          price: 45.5,
          stock: 200,
          createdBy: user1.id,
        },
        {
          name: 'Noise-Cancelling Headphones',
          description:
            'Premium wireless headphones with active noise cancellation',
          price: 299.99,
          stock: 60,
          createdBy: user2.id,
        },
        {
          name: 'Webcam HD',
          description: '1080p webcam with built-in microphone',
          price: 79.99,
          stock: 100,
          createdBy: user1.id,
        },
        {
          name: 'Desk Lamp LED',
          description: 'Adjustable LED desk lamp with touch control',
          price: 34.99,
          stock: 120,
          createdBy: user2.id,
        },
      ],
    });

    console.log('✅ Products created');

    // Get created products for inventory movements
    const laptop = await prisma.product.findFirst({
      where: { name: 'Laptop Pro 15"' },
    });
    const mouse = await prisma.product.findFirst({
      where: { name: 'Wireless Mouse' },
    });
    const keyboard = await prisma.product.findFirst({
      where: { name: 'Mechanical Keyboard' },
    });
    const monitor = await prisma.product.findFirst({
      where: { name: '4K Monitor 27"' },
    });

    // Create inventory movements (realistic scenario)
    await prisma.inventoryMovement.createMany({
      data: [
        // Initial stock received from supplier
        {
          productId: laptop.id,
          type: 'IN',
          quantity: 30,
          reference: 'PO-2024-001',
          note: 'Initial stock delivery',
          createdBy: user2.id, // Admin receives stock
        },
        {
          productId: mouse.id,
          type: 'IN',
          quantity: 200,
          reference: 'PO-2024-001',
          note: 'Restock shipment',
          createdBy: user2.id,
        },
        {
          productId: keyboard.id,
          type: 'IN',
          quantity: 100,
          reference: 'PO-2024-002',
          note: 'Backorder arrival',
          createdBy: user2.id,
        },
        // Customer orders (OUT)
        {
          productId: laptop.id,
          type: 'OUT',
          quantity: 5,
          reference: 'ORDER-12345',
          note: 'Customer shipment',
          createdBy: user1.id, // User processes order
        },
        {
          productId: mouse.id,
          type: 'OUT',
          quantity: 50,
          reference: 'ORDER-12346',
          note: 'Bulk order dispatch',
          createdBy: user1.id,
        },
        {
          productId: keyboard.id,
          type: 'OUT',
          quantity: 25,
          reference: 'ORDER-12347',
          note: 'Retail order fulfillment',
          createdBy: user1.id,
        },
        // Stock adjustment (damaged/lost items)
        {
          productId: monitor.id,
          type: 'ADJUSTMENT',
          quantity: -5,
          reference: 'ADJ-2024-001',
          note: 'Damaged items from shipping',
          createdBy: user2.id, // Only admin can adjust
        },
        {
          productId: laptop.id,
          type: 'ADJUSTMENT',
          quantity: 3,
          reference: 'ADJ-2024-002',
          note: 'Found in warehouse during inventory check',
          createdBy: user2.id,
        },
      ],
    });

    console.log('✅ Inventory movements created');

    console.log('✅ Seed data created:');
    console.log('Users:', { user1, user2 });
    console.log(`Products: ${products.count} items created`);
    console.log('\n📝 Test Credentials:');
    console.log('User: user@test.com / password123');
    console.log('Admin: admin@test.com / admin123');
    console.log('\n📦 Product Summary:');
    console.log(`- User created: 4 products`);
    console.log(`- Admin created: 4 products`);
    console.log('\nInventory Movements:');
    console.log('- 3x IN (stock received from suppliers)');
    console.log('- 3x OUT (customer orders)');
    console.log('- 2x ADJUSTMENT (warehouse corrections)');
    console.log('\n🔍 To test inventory management:');
    console.log('1. Login to get access token');
    console.log('2. Get product IDs from GET /api/products');
    console.log(
      '3. View history: GET /api/inventory-movements/product/:productId',
    );
    console.log('4. Test movements: POST /api/inventory-movements');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('\n✅ Seed completed successfully!');
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
