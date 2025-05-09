import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { randomStringGenerator } from "@nestjs/common/utils/random-string-generator.util";

describe('Quota Limits (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let prisma: PrismaClient;
  let userId: string;
  const uploadedFiles: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = new PrismaClient();

    const username = `quotauser_${Date.now()}`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username, password: 'testpassword' });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username, password: 'testpassword' });

    token = loginResponse.body.access_token;

    const user = await prisma.user.findUnique({
      where: { username },
      select: { userId: true },
    });

    if (!user) {
      throw new Error(`Usuario ${username} no encontrado`);
    }

    userId = user.userId;
  });

  it('should upload a file and update user quota', async () => {
    const testFilePath = path.join(__dirname, 'test-quota-file.txt');
    const oneMB = 1024 * 1024;
    const testData = Buffer.alloc(oneMB, 'a');
    fs.writeFileSync(testFilePath, testData);

    const response = await request(app.getHttpServer())
      .post('/files/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testFilePath)
      .expect(201);

    const fileKey = response.text.split('/').pop() || '';
    uploadedFiles.push(fileKey);

    const updatedUser = await prisma.user.findUnique({
      where: { userId },
      select: { usedquota: true },
    });

    if (!updatedUser) {
      throw new Error(`Usuario con ID ${userId} no encontrado`);
    }

    expect(updatedUser.usedquota).toBeGreaterThanOrEqual(oneMB);

    fs.unlinkSync(testFilePath);
  });

  it('should get updated quota information in stats', async () => {
    const response = await request(app.getHttpServer())
      .get('/stats/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.usedQuota).toBeGreaterThan(0);
    expect(response.body.quotaPercentage).toBeGreaterThan(0);
  });

  it('should update quota when a file is deleted', async () => {
    if (uploadedFiles.length === 0) {
      console.error('No files uploaded in previous tests');
      return;
    }

    const beforeDelete = await prisma.user.findUnique({
      where: { userId },
      select: { usedquota: true },
    });

    if (!beforeDelete) {
      throw new Error(`Usuario con ID ${userId} no encontrado antes de eliminar`);
    }

    const fileToDelete = uploadedFiles[0];
    await request(app.getHttpServer())
      .delete(`/files/${fileToDelete}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const afterDelete = await prisma.user.findUnique({
      where: { userId },
      select: { usedquota: true },
    });

    if (!afterDelete) {
      throw new Error(`Usuario con ID ${userId} no encontrado después de eliminar`);
    }

    expect(afterDelete.usedquota).toBeLessThan(beforeDelete.usedquota);

    uploadedFiles.shift();
  });

  it('should simulate quota limit check', async () => {
    const nearLimit = 5 * 1024 * 1024;
    const date = Date.now();
    await prisma.user.create({
      data: {
        username: `userForQuotaTest_${date}`,
        password: 'irrelevanteEnTest',
        role: 'USER',
        usedquota: nearLimit,
      },
    });

    const testFilePath = path.join(__dirname, 'test-over-quota.txt');
    const twoMB = 2 * 1024 * 1024;
    const testData = Buffer.alloc(twoMB, 'b');
    fs.writeFileSync(testFilePath, testData);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: `userForQuotaTest_${date}`, password: 'irrelevanteEnTest' });

    const token2 = loginResponse.body.access_token;

    await request(app.getHttpServer())
      .post('/files/upload')
      .set('Authorization', `Bearer ${token2}`)
      .attach('file', testFilePath)
      .expect(403);

    fs.unlinkSync(testFilePath);

    await prisma.user.delete({
      where: { userId },
    });
  });

  afterAll(async () => {
    for (const fileKey of uploadedFiles) {
      try {
        await request(app.getHttpServer())
          .delete(`/files/${fileKey}`)
          .set('Authorization', `Bearer ${token}`);
      } catch (e) {
        console.error(`Error limpiando archivo ${fileKey}: ${e.message}`);
      }
    }

    await prisma.$disconnect();
    await app.close();
  });
});
