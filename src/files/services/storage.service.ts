import { Injectable } from '@nestjs/common';
import { S3Provider } from './s3.provider';
import { AzureProvider } from './azure.provider';
import { StorageInterface } from './storage.interface';

@Injectable()
export class StorageService implements StorageInterface {
  constructor(
    private readonly s3: S3Provider,
    private readonly azure: AzureProvider,
  ) {}

  async upload(file: Express.Multer.File, key: string): Promise<string> {
    try {
      return await this.s3.upload(file, key);
    } catch (s3Error) {
      console.error('S3 failed, falling back to Azure:', s3Error);
      return await this.azure.upload(file, key);
    }
  }

  async delete(fileKey: string): Promise<void> {
    try {
      await this.s3.delete(fileKey);
      console.log(`Successfully deleted ${fileKey} from S3`);
      return; // Si la eliminación en S3 fue exitosa, no intentamos en Azure
    } catch (e) {
      console.error(`S3 delete failed for ${fileKey}, attempting Azure: ${e.message}`);

      // Si el error de S3 indica que el archivo no existe, intentamos con Azure
      try {
        await this.azure.delete(fileKey);
        console.log(`Successfully deleted ${fileKey} from Azure`);
      } catch (azureError) {
        console.error(`Azure delete also failed: ${azureError.message}`);
        throw new Error(`Failed to delete file ${fileKey}: ${azureError.message}`);
      }
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
