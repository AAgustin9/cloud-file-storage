import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppE2eModule } from './app.e2e-module';
import { PrismaClient, Role } from '@prisma/client';

describe('StatsController (e2e)', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppE2eModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = new PrismaClient();

    const regularUsername = `regular_user_${Date.now()}`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: regularUsername, password: 'test123' });

    const userLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: regularUsername, password: 'test123' });

    userToken = userLoginResponse.body.access_token;

    const adminUsername = `admin_user_${Date.now()}`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: adminUsername, password: 'test123' });

    await prisma.user.update({
      where: { username: adminUsername },
      data: { role: Role.ADMIN },
    });

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: adminUsername, password: 'test123' });

    adminToken = adminLoginResponse.body.access_token;
  });

  it('should deny access to global stats for regular users', async () => {
    await request(app.getHttpServer())
      .get('/stats')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('should allow admin to access global stats', async () => {
    await request(app.getHttpServer())
      .get('/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('users');
        expect(Array.isArray(res.body.users)).toBe(true);
        expect(res.body).toHaveProperty('summary');
        expect(res.body.summary).toHaveProperty('totalUsers');
        expect(res.body.summary).toHaveProperty('totalFiles');
        expect(res.body.summary).toHaveProperty('totalStorage');
      });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });
});
