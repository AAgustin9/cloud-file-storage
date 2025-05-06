import { Injectable, Logger } from '@nestjs/common';
import { CloudStorageProvider } from '../cloudStorageProvider';

@Injectable()
export class FallbackStorageProvider implements CloudStorageProvider {
  private readonly logger = new Logger(FallbackStorageProvider.name);
  private primaryAvailable = true;

  constructor(
    private readonly primaryProvider: CloudStorageProvider,
    private readonly secondaryProvider: CloudStorageProvider,
  ) {}

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      let primaryKey: string | undefined;
      if (this.primaryAvailable) {
        try {
          primaryKey = await this.primaryProvider.uploadFile(file);
        } catch (err) {
          this.primaryAvailable = false;
          this.logger.error(`Primary provider upload failed: ${err.message}`);
        }
      }

      const secondaryKey = await this.secondaryProvider.uploadFile(file);
      if (!this.primaryAvailable && primaryKey) {
        this.primaryAvailable = true;
        this.logger.log('Primary provider is available again');
      }

      return primaryKey && this.primaryAvailable ? primaryKey : secondaryKey;
    } catch (error) {
      this.logger.error(`All providers failed: ${error.message}`);
      throw new Error('All storage providers are unavailable');
    }
  }

  async deleteFile(fileKey: string): Promise<void> {
    try {
      if (this.primaryAvailable) {
        try {
          await this.primaryProvider.deleteFile(fileKey);
        } catch (err) {
          this.logger.error(`Primary provider deletion failed: ${err.message}`);
          this.primaryAvailable = false;
        }
      }
    } catch (error) {
      this.logger.error(`Error handling primary provider deletion: ${error.message}`);
    }

    try {
      await this.secondaryProvider.deleteFile(fileKey);
    } catch (error) {
      this.logger.error(`Secondary provider deletion failed: ${error.message}`);

      if (!this.primaryAvailable) {
        throw new Error('All storage providers are unavailable');
      }
    }
  }

  async getFileAndDownload(fileKey: string): Promise<Buffer> {
    try {
      if (this.primaryAvailable) {
        try {
          return await this.primaryProvider.getFileAndDownload(fileKey);
        } catch (err) {
          this.primaryAvailable = false;
          this.logger.error(`Primary provider getFileAndDownload failed: ${err.message}`);
        }
      }

      return await this.secondaryProvider.getFileAndDownload(fileKey);
    } catch (error) {
      this.logger.error(`All providers failed to download file: ${error.message}`);
      throw new Error('All storage providers are unavailable');
    }
  }
}
