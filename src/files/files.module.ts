import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { S3Provider } from './services/s3.provider';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './services/storage.service';
import { AzureProvider } from './services/azure.provider';

@Module({
  imports: [ConfigModule],
  controllers: [FilesController],
  providers: [FilesService, S3Provider, AzureProvider, StorageService],
  exports: [FilesService],
})
export class FilesModule {}
