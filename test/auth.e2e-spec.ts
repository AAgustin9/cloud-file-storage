import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppE2eModule } from './app.e2e-module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppE2eModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should register a user', () => {
    const date = Date.now();
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: `testuser${date}`, password: 'testpass90' })
      .expect(201)
      .expect((res) => {
        expect(res.body.message).toBe('User registered successfully');
      });
  });

  it('should login the user and return a token', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'testuser', password: 'testpass' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');
      });
  });

  it('should reject login with wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'testuser', password: 'wrongpass' })
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
