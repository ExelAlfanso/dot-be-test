import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.intercepter';

describe('Auth (e2e)', () => {
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

  describe('POST /api/auth/login (seeded users)', () => {
    it('should login as USER', async () => {
      const token = await loginAs('user@test.com', 'password123');
      expect(token).toBeDefined();
    });

    it('should login as ADMIN', async () => {
      const token = await loginAs('admin@test.com', 'admin123');
      expect(token).toBeDefined();
    });

    it('should reject invalid password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'wrongpass',
        })
        .expect(401);
    });
  });
});
