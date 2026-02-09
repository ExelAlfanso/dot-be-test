import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.intercepter';

describe('Profile (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/profile', () => {
    it('should get USER profile', async () => {
      const token = await loginAs('user@test.com', 'password123');

      const response = await request(app.getHttpServer())
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const data = extractData(response);
      expect(data).toHaveProperty('role', 'USER');
    });

    it('should get ADMIN profile', async () => {
      const token = await loginAs('admin@test.com', 'admin123');

      const response = await request(app.getHttpServer())
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const data = extractData(response);
      expect(data).toHaveProperty('role', 'ADMIN');
    });

    it('should reject missing token', async () => {
      await request(app.getHttpServer()).get('/api/profile').expect(401);
    });
  });
});
