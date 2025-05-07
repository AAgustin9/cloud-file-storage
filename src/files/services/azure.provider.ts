import { Injectable } from '@nestjs/common';
import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuid } from 'uuid';
import { StorageInterface } from './storage.interface';

@Injectable()
export class AzureProvider implements StorageInterface {
  private client = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING!,
  );

  async upload(file: Express.Multer.File): Promise<string> {
    const containerClient = this.client.getContainerClient(process.env.AZURE_CONTAINER!);
    const blobName = `${uuid()}-${file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });
    return blockBlobClient.url;
  }

  async delete(fileKey: string): Promise<void> {
    const containerClient = this.client.getContainerClient(process.env.AZURE_CONTAINER!);
    const blobClient = containerClient.getBlobClient(fileKey);
    await blobClient.delete();
  }

  async getFile(fileKey: string): Promise<string> {
    const container = this.client.getContainerClient(process.env.AZURE_CONTAINER!);
    const blobClient = container.getBlobClient(fileKey);
    return blobClient.url;
  }
}
