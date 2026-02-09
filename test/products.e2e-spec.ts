import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.intercepter';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let productId: number;
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
    adminToken = await loginAs('admin@test.com', 'admin123');
    userToken = await loginAs('user@test.com', 'password123');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/products (seeded data)', () => {
    it('should list all 8 seeded products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      const data = extractData(response);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(8);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('name');
      expect(data[0]).toHaveProperty('price');
    });

    it('should contain expected seeded products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      const data = extractData(response);
      const productNames = data.map((p) => p.name);
      expect(productNames).toContain('Laptop Pro 15"');
      expect(productNames).toContain('Wireless Mouse');
    });
  });

  describe('PATCH /api/products/:id (ownership enforcement)', () => {
    it('should allow ADMIN to update seeded admin product', async () => {
      const listRes = await request(app.getHttpServer()).get('/api/products');
      const products = extractData(listRes);
      const adminProduct = products.find(
        (p) => p.name === 'Mechanical Keyboard',
      );

      const updateRes = await request(app.getHttpServer())
        .patch(`/api/products/${adminProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 99.99 })
        .expect(200);

      const updated = extractData(updateRes);
      expect(updated).toHaveProperty('price', 99.99);
    });

    it('should prevent USER from updating ADMIN product', async () => {
      const listRes = await request(app.getHttpServer()).get('/api/products');
      const products = extractData(listRes);
      const adminProduct = products.find(
        (p) => p.name === 'Mechanical Keyboard',
      );

      await request(app.getHttpServer())
        .patch(`/api/products/${adminProduct.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ price: 1.0 })
        .expect(403);
    });
  });

  describe('POST /api/products', () => {
    it('ADMIN can create product', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          price: 100,
          stock: 10,
        })
        .expect(201);

      productId = extractData(res).id;
    });
  });
  describe('DELETE /api/products/:id (ownership enforcement)', () => {
    it('should prevent USER from deleting ADMIN product', async () => {
      const listRes = await request(app.getHttpServer()).get('/api/products');
      const products = extractData(listRes);
      const adminProduct = products.find(
        (p) => p.name === 'Mechanical Keyboard',
      );

      await request(app.getHttpServer())
        .delete(`/api/products/${adminProduct.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
    it('ADMIN can delete own product', async () => {
      await request(app.getHttpServer())
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
