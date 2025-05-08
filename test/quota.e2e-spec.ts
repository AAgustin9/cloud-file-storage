import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

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

    // Registrar un usuario para las pruebas
    const username = `quotauser_${Date.now()}`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username, password: 'testpassword' });

    // Iniciar sesión para obtener un token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username, password: 'testpassword' });
    
    token = loginResponse.body.access_token;

    // Obtener el ID del usuario
    const user = await prisma.user.findUnique({
      where: { username },
      select: { userId: true }
    });
    
    if (!user) {
      throw new Error(`Usuario ${username} no encontrado`);
    }
    
    userId = user.userId;
  });

  it('should upload a file and update user quota', async () => {
    // Crear un archivo de prueba de 1MB
    const testFilePath = path.join(__dirname, 'test-quota-file.txt');
    const oneMB = 1024 * 1024;
    const testData = Buffer.alloc(oneMB, 'a');
    fs.writeFileSync(testFilePath, testData);

    const response = await request(app.getHttpServer())
      .post('/files/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testFilePath)
      .expect(201);

    // Guardar la clave del archivo subido
    const fileKey = response.text.split('/').pop() || '';
    uploadedFiles.push(fileKey);

    // Verificar que la cuota del usuario se actualizó
    const updatedUser = await prisma.user.findUnique({
      where: { userId },
      select: { usedquota: true }
    });

    if (!updatedUser) {
      throw new Error(`Usuario con ID ${userId} no encontrado`);
    }

    expect(updatedUser.usedquota).toBeGreaterThanOrEqual(oneMB);

    // Limpiar el archivo temporal
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

    // Tomar nota de la cuota antes de eliminar
    const beforeDelete = await prisma.user.findUnique({
      where: { userId },
      select: { usedquota: true }
    });

    if (!beforeDelete) {
      throw new Error(`Usuario con ID ${userId} no encontrado antes de eliminar`);
    }

    // Eliminar un archivo
    const fileToDelete = uploadedFiles[0];
    await request(app.getHttpServer())
      .delete(`/files/${fileToDelete}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verificar que la cuota se redujo
    const afterDelete = await prisma.user.findUnique({
      where: { userId },
      select: { usedquota: true }
    });

    if (!afterDelete) {
      throw new Error(`Usuario con ID ${userId} no encontrado después de eliminar`);
    }

    expect(afterDelete.usedquota).toBeLessThan(beforeDelete.usedquota);

    // Eliminar el archivo de la lista de archivos subidos
    uploadedFiles.shift();
  });

  // Test para verificar el límite de cuota
  // Este test es más conceptual ya que no queremos llenar 5GB en pruebas reales
  it('should simulate quota limit check', async () => {
    // Establecer la cuota del usuario justo por debajo del límite (5GB - 1MB)
    const nearLimit = 5 * 1024 * 1024 * 1024 - 1024 * 1024;
    await prisma.user.update({
      where: { userId },
      data: { usedquota: nearLimit },
    });

    // Crear un archivo de prueba de 2MB (que excederá el límite)
    const testFilePath = path.join(__dirname, 'test-over-quota.txt');
    const twoMB = 2 * 1024 * 1024;
    const testData = Buffer.alloc(twoMB, 'b');
    fs.writeFileSync(testFilePath, testData);

    // Intentar subir el archivo (debería fallar por límite de cuota)
    await request(app.getHttpServer())
      .post('/files/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testFilePath)
      .expect(403); // Forbidden - cuota excedida

    // Limpiar el archivo temporal
    fs.unlinkSync(testFilePath);

    // Devolver la cuota a un valor normal para futuras pruebas
    await prisma.user.update({
      where: { userId },
      data: { usedquota: 0 }
    });
  });

  afterAll(async () => {
    // Eliminar archivos que pudieron haberse subido
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