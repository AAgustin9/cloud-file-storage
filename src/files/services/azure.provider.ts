import { Injectable } from '@nestjs/common';
import { BlobServiceClient } from '@azure/storage-blob';
import { StorageInterface } from './storage.interface';

@Injectable()
export class AzureProvider implements StorageInterface {
  private client: BlobServiceClient;
  private containerName: string = process.env.AZURE_CONTAINER || '';

  constructor() {
    const conn = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
    this.client = BlobServiceClient.fromConnectionString(conn);
  }

  async upload(file: Express.Multer.File, key: string): Promise<string> {
    const containerClient = this.client.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });
    return blockBlobClient.url;
  }

  async delete(fileKey: string): Promise<void> {
    const containerClient = this.client.getContainerClient(this.containerName);
    const blobClient = containerClient.getBlobClient(fileKey);
    await blobClient.deleteIfExists();
  }

  async getFile(fileKey: string): Promise<string> {
    const container = this.client.getContainerClient(this.containerName);
    const blobClient = container.getBlobClient(fileKey);
    return blobClient.url;
  }
}
