import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/interceptors/transform.intercepter';

describe('Inventory Movements (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let productId: string;

  const extractData = (response: request.Response) =>
    response.body?.data ?? response.body;

  const loginAs = async (email: string, password: string) => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    return extractData(res).accessToken;
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // login
    adminToken = await loginAs('admin@test.com', 'admin123');
    userToken = await loginAs('user@test.com', 'password123');

    // seed product
    const productRes = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Inventory Test Product',
        price: 10,
        stock: 0,
      })
      .expect(201);

    productId = extractData(productRes).id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/inventory-movements', () => {
    it('ADMIN can add IN movement', async () => {
      // Get first product

      const response = await request(app.getHttpServer())
        .post('/api/inventory-movements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId,
          type: 'IN',
          quantity: 50,
          reference: 'PO-TEST-001',
          note: 'Test incoming stock',
        })
        .expect(201);

      const data = extractData(response);
      expect(data).toHaveProperty('type', 'IN');
      expect(data).toHaveProperty('quantity', 50);
      expect(data).toHaveProperty('product');
    });

    it('ADMIN can add OUT movement', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inventory-movements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId,
          type: 'OUT',
          quantity: 10,
          reference: 'SO-TEST-001',
        })
        .expect(201);

      const data = extractData(response);
      expect(data).toHaveProperty('type', 'OUT');
      expect(data).toHaveProperty('quantity', 10);
    });

    it('ADMIN can add ADJUSTMENT movement', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inventory-movements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId,
          type: 'ADJUSTMENT',
          quantity: 0,
          reference: 'ADJ-TEST-001',
          note: 'Inventory count',
        })
        .expect(201);

      const data = extractData(response);
      expect(data).toHaveProperty('type', 'ADJUSTMENT');
    });

    it('USER cannot add movement', async () => {
      await request(app.getHttpServer())
        .post('/api/inventory-movements')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          type: 'IN',
          quantity: 50,
        })
        .expect(403);
    });

    it('Unauthenticated request fails (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/inventory-movements')
        .send({
          productId,
          type: 'IN',
          quantity: 50,
        })
        .expect(401);
    });
  });

  describe('GET /api/inventory-movements/product/:productId', () => {
    it('ADMIN can view inventory movements', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/inventory-movements/product/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const data = extractData(response);
      expect(Array.isArray(data)).toBe(true);
    });

    it('USER can view inventory movements', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/inventory-movements/product/${productId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const data = extractData(res);
      expect(Array.isArray(data)).toBe(true);
    });

    it('Unauthenticated request fails (401)', async () => {
      await request(app.getHttpServer())
        .get(`/api/inventory-movements/product/${productId}`)
        .expect(401);
    });

    it('Non-existent product returns 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/api/inventory-movements/product/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('GET /api/inventory-movements', () => {
    it('ADMIN can list all movements', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/inventory-movements')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const data = extractData(response);
      expect(Array.isArray(data)).toBe(true);
    });

    it('USER can list movements', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/inventory-movements')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const data = extractData(res);
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
