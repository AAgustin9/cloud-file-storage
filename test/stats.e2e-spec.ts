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

    // Crear un usuario normal
    const regularUsername = `regular_user_${Date.now()}`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: regularUsername, password: 'test123' });

    // Iniciar sesión como usuario normal
    const userLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: regularUsername, password: 'test123' });

    userToken = userLoginResponse.body.access_token;

    // Crear un usuario administrador
    const adminUsername = `admin_user_${Date.now()}`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: adminUsername, password: 'test123' });

    // Convertir el usuario en administrador
    await prisma.user.update({
      where: { username: adminUsername },
      data: { role: Role.ADMIN },
    });

    // Iniciar sesión como administrador
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: adminUsername, password: 'test123' });

    adminToken = adminLoginResponse.body.access_token;
  });

  it('should get personal stats for a regular user', async () => {
    await request(app.getHttpServer())
      .get('/stats/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('userId');
        expect(res.body).toHaveProperty('username');
        expect(res.body).toHaveProperty('usedQuota');
        expect(res.body).toHaveProperty('usedQuotaHuman');
        expect(res.body).toHaveProperty('quotaPercentage');
        expect(res.body).toHaveProperty('fileCount');
        expect(res.body).toHaveProperty('recentFiles');
        expect(Array.isArray(res.body.recentFiles)).toBe(true);
      });
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
