import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/interceptors/transform.intercepter';

describe('App Integration (e2e)', () => {
  let app: INestApplication;

  const extractData = (response: request.Response) =>
    response.body?.data ?? response.body;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Basic endpoints', () => {
    it('GET /hello should return 200', async () => {
      await request(app.getHttpServer()).get('/api/hello').expect(200);
    });

    it('should access public product list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      const data = extractData(response);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Full auth flow', () => {
    it('should login → get profile → access protected endpoints', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'admin123',
        })
        .expect(200);

      const token = extractData(loginRes).accessToken;

      const profileRes = await request(app.getHttpServer())
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const profile = extractData(profileRes);
      expect(profile).toHaveProperty('role', 'ADMIN');

      const listRes = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      const products = extractData(listRes);
      const firstProductId = products[0]?.id;

      if (firstProductId) {
        const movementsRes = await request(app.getHttpServer())
          .get(`/api/inventory-movements/product/${firstProductId}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        const movements = extractData(movementsRes);
        expect(Array.isArray(movements)).toBe(true);
      }
    });
  });
});
