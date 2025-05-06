import { Injectable } from '@nestjs/common';
import { CloudStorageProvider } from '../cloudStorageProvider';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AzureBlobProvider implements CloudStorageProvider {
  private containerClient: ContainerClient;

  constructor(config: ConfigService) {
    const containerName = config.get('AZURE_STORAGE_CONTAINER_NAME');
    const connectionString = config.get('AZURE_STORAGE_CONNECTION_STRING');

    const blobService = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = blobService.getContainerClient(containerName);
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const key = `${uuid()}-${file.originalname}`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(key);

    await blockBlobClient.upload(file.buffer, file.size, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
      },
    });
    return key;
  }

  async deleteFile(fileKey: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(fileKey);
    await blockBlobClient.delete();
  }

  async getFileAndDownload(fileKey: string): Promise<Buffer> {
    const blobClient = this.containerClient.getBlobClient(fileKey);
    const downloadResponse = await blobClient.download();

    if (!downloadResponse.readableStreamBody) {
      throw new Error('Download failed: stream is null');
    }

    return this.streamToBuffer(downloadResponse.readableStreamBody);
  }

  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }
}
