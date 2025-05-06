import { Inject, Injectable } from '@nestjs/common';
import { CloudStorageProvider } from './cloudStorageProvider';
import { STORAGE_PROVIDER_TOKEN } from './files.module';

@Injectable()
export class FilesService {
  constructor(
    @Inject(STORAGE_PROVIDER_TOKEN)
    private readonly storage: CloudStorageProvider,
  ) {}

  async uploadFile(file: Express.Multer.File): Promise<string> {
    return this.storage.uploadFile(file);
  }

  async deleteFile(fileKey: string): Promise<void> {
    return this.storage.deleteFile(fileKey);
  }

  async getFile(fileKey: string): Promise<Buffer> {
    return this.storage.getFileAndDownload(fileKey);
  }
}
