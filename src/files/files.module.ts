import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { S3Provider } from './services/s3.provider';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FallbackStorageProvider } from './services/fallback-storage.provider';
import { AzureBlobProvider } from './services/azure.provider';
import { CloudStorageProvider } from './cloudStorageProvider';

export const STORAGE_PROVIDER_TOKEN = 'StorageProvider';
export const PRIMARY_STORAGE_PROVIDER_TOKEN = 'PrimaryStorageProvider';
export const SECONDARY_STORAGE_PROVIDER_TOKEN = 'SecondaryStorageProvider';

@Module({
  imports: [ConfigModule],
  controllers: [FilesController],
  providers: [
    FilesService,
    S3Provider,
    AzureBlobProvider,
    {
      provide: PRIMARY_STORAGE_PROVIDER_TOKEN,
      useFactory: (configService: ConfigService): CloudStorageProvider => {
        const primaryStorageType = configService.get<string>('PRIMARY_STORAGE_PROVIDER', 's3');

        switch (primaryStorageType.toLowerCase()) {
          case 's3':
            return new S3Provider(configService);
          case 'azure':
            return new AzureBlobProvider(configService);
          default:
            throw new Error(`Unsupported primary storage provider: ${primaryStorageType}`);
        }
      },
      inject: [ConfigService],
    },
    {
      provide: SECONDARY_STORAGE_PROVIDER_TOKEN,
      useFactory: (configService: ConfigService): CloudStorageProvider => {
        const secondaryStorageType = configService.get<string>(
          'SECONDARY_STORAGE_PROVIDER',
          'azure',
        );

        const primaryType = configService.get<string>('PRIMARY_STORAGE_PROVIDER', 's3');
        if (secondaryStorageType.toLowerCase() === primaryType.toLowerCase()) {
          throw new Error('Secondary storage provider must be different from primary');
        }

        switch (secondaryStorageType.toLowerCase()) {
          case 's3':
            return new S3Provider(configService);
          case 'azure':
            return new AzureBlobProvider(configService);
          default:
            throw new Error(`Unsupported secondary storage provider: ${secondaryStorageType}`);
        }
      },
      inject: [ConfigService],
    },
    {
      provide: STORAGE_PROVIDER_TOKEN,
      useFactory: (
        primary: CloudStorageProvider,
        secondary: CloudStorageProvider,
      ): CloudStorageProvider => {
        return new FallbackStorageProvider(primary, secondary);
      },
      inject: [PRIMARY_STORAGE_PROVIDER_TOKEN, SECONDARY_STORAGE_PROVIDER_TOKEN],
    },
  ],
  exports: [FilesService],
})
export class FilesModule {}
