import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppE2eModule } from './app.e2e-module';
import * as fs from 'fs';
import * as path from 'path';

describe('FilesController (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let uploadedFileKey: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppE2eModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const username = `testuser_${Date.now()}`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username, password: 'testpassword' });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username, password: 'testpassword' });

    token = loginResponse.body.access_token;
  });

  it('should upload a file', async () => {
    const testFilePath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(testFilePath, 'This is a test file content');

    const response = await request(app.getHttpServer())
      .post('/files/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testFilePath)
      .expect(201);

    expect(response.text).toBeDefined();
    expect(typeof response.text).toBe('string');
    uploadedFileKey = response.text.split('/').pop()!;

    fs.unlinkSync(testFilePath);
  });

  it('should get the uploaded file', async () => {
    await request(app.getHttpServer())
      .get(`/files/upload/${uploadedFileKey}`)
      .set('Authorization', `Bearer ${token}`)
      .expect((res) => {
        expect(res.text).toBeDefined();
      });
  });

  it('should fail to get non-existent file', async () => {
    await request(app.getHttpServer())
      .get('/files/non-existent-file')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('should delete the uploaded file', async () => {
    await request(app.getHttpServer())
      .delete(`/files/${uploadedFileKey}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('should fail to get the deleted file', async () => {
    await request(app.getHttpServer())
      .get(`/files/${uploadedFileKey}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  afterAll(async () => {
    await app.close();
  });
});
