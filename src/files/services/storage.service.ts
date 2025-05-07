import { Injectable } from '@nestjs/common';
import { S3Provider } from './s3.provider';
import { AzureProvider } from './azure.provider';

@Injectable()
export class StorageService {
  constructor(
    private readonly s3: S3Provider,
    private readonly azure: AzureProvider,
  ) {}

  async upload(file: Express.Multer.File): Promise<string> {
    try {
      const url = await this.s3.upload(file);
      await this.azure.upload(file);
      return url;
    } catch (s3Error) {
      console.error('S3 failed, falling back to Azure:', s3Error);
      return await this.azure.upload(file);
    }
  }

  async deleteFile(fileKey: string): Promise<void> {
    try {
      await this.s3.delete(fileKey);
      await this.azure.delete(fileKey);
    } catch (s3Error) {
      console.error('S3 failed, falling back to Azure:', s3Error);
      await this.azure.delete(fileKey);
    }
  }

  async getFile(fileKey: string): Promise<string> {
    try {
      return await this.s3.getFile(fileKey);
    } catch (s3Error) {
      console.error('S3 failed, falling back to Azure:', s3Error);
      return await this.azure.getFile(fileKey);
    }
  }
}
