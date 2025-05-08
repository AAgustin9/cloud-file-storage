import { Injectable, Logger } from '@nestjs/common';
import { BlobServiceClient } from '@azure/storage-blob';
import { StorageInterface } from './storage.interface';

@Injectable()
export class AzureProvider implements StorageInterface {
  private client: BlobServiceClient;
  private containerName: string;
  private isConfigured: boolean = false;
  private readonly logger = new Logger(AzureProvider.name);

  constructor() {
    this.containerName = process.env.AZURE_CONTAINER || '';
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
    
    this.isConfigured = !!(connectionString && this.containerName);
    
    if (this.isConfigured) {
      try {
        this.client = BlobServiceClient.fromConnectionString(connectionString);
        this.logger.log('Azure Blob Storage initialized successfully');
      } catch (error) {
        this.isConfigured = false;
        this.logger.error(`Failed to initialize Azure Blob Storage: ${error.message}`);
      }
    } else {
      this.logger.warn('Azure Blob Storage is not properly configured. Check your environment variables.');
    }
  }

  async upload(file: Express.Multer.File, key: string): Promise<string> {
    try {
      if (!this.isConfigured) {
        throw new Error('Azure Blob Storage is not configured. Please check your environment variables.');
      }
      
      const containerClient = this.client.getContainerClient(this.containerName);
      // Verificar si el contenedor existe
      const containerExists = await containerClient.exists();
      if (!containerExists) {
        throw new Error(`Azure container '${this.containerName}' does not exist.`);
      }
      
      const blockBlobClient = containerClient.getBlockBlobClient(key);
      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
      });
      return blockBlobClient.url;
    } catch (error) {
      console.error(`Azure upload error: ${error.message}`);
      throw error;
    }
  }

  async delete(fileKey: string): Promise<void> {
    try {
      if (!this.isConfigured) {
        throw new Error('Azure Blob Storage is not configured. Please check your environment variables.');
      }
      
      const containerClient = this.client.getContainerClient(this.containerName);
      // Verificar si el contenedor existe
      const containerExists = await containerClient.exists();
      if (!containerExists) {
        throw new Error(`Azure container '${this.containerName}' does not exist.`);
      }
      
      const blobClient = containerClient.getBlobClient(fileKey);
      // Verificar si el blob existe antes de intentar eliminarlo
      const blobExists = await blobClient.exists();
      if (!blobExists) {
        console.log(`File ${fileKey} does not exist in Azure container.`);
        return; // No es necesario eliminarlo si no existe
      }
      
      await blobClient.deleteIfExists();
    } catch (error) {
      console.error(`Azure delete error: ${error.message}`);
      throw error;
    }
  }

  async getFile(fileKey: string): Promise<string> {
    try {
      if (!this.isConfigured) {
        throw new Error('Azure Blob Storage is not configured. Please check your environment variables.');
      }
      
      const containerClient = this.client.getContainerClient(this.containerName);
      // Verificar si el contenedor existe
      const containerExists = await containerClient.exists();
      if (!containerExists) {
        throw new Error(`Azure container '${this.containerName}' does not exist.`);
      }
      
      const blobClient = containerClient.getBlobClient(fileKey);
      // Verificar si el blob existe
      const blobExists = await blobClient.exists();
      if (!blobExists) {
        throw new Error(`File ${fileKey} does not exist in Azure container.`);
      }
      
      return blobClient.url;
    } catch (error) {
      console.error(`Azure getFile error: ${error.message}`);
      throw error;
    }
  }
}
