import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppE2eModule } from './app.e2e-module';
import { PrismaClient, Role } from '@prisma/client';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let token: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppE2eModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = new PrismaClient();

    const username = `testuser_${Date.now()}`;
    const adminUsername = `admin_${Date.now()}`;

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username, password: 'testpass' });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username, password: 'testpass' });

    token = loginResponse.body.access_token;

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: adminUsername, password: 'adminpass' });

    await prisma.user.update({
      where: { username: adminUsername },
      data: { role: Role.ADMIN },
    });

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: adminUsername, password: 'adminpass' });

    adminToken = adminLoginResponse.body.access_token;
  });

  it('should create a new user', async () => {
    const date = Date.now() + 22;
    const newUsername = `newuser_${date}`;

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: newUsername, password: 'newpass' })
      .expect(201);

    const user = await prisma.user.findUnique({
      where: { username: newUsername },
    });

    expect(user).not.toBeNull();
    if (user) {
      expect(user.username).toBe(newUsername);
    }
  });

  it('should require authentication for protected routes', async () => {
    await request(app.getHttpServer()).get('/stats').expect(401);
  });

  it('should validate token on protected routes', async () => {
    await request(app.getHttpServer())
      .get('/stats')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    await request(app.getHttpServer())
      .get('/stats')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('should enforce admin role for admin-only routes', async () => {
    await request(app.getHttpServer())
      .get('/stats')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });
});
