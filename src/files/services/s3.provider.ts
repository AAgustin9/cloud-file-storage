import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandOutput,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { CloudStorageProvider } from '../cloudStorageProvider';
import { Buffer } from 'buffer';

@Injectable()
export class S3Provider implements CloudStorageProvider {
  private s3: S3Client;
  private readonly bucketName: string;

  constructor(private config: ConfigService) {
    const region = this.config.get<string>('AWS_REGION');
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing AWS credentials');
    }

    this.s3 = new S3Client({
      region,
      credentials: {
        //ver si tengo q usar fromEnv tiene q tener el nombre de los de aws, usando una dependecia
        accessKeyId,
        secretAccessKey,
      },
    });

    const bucketName = this.config.get<string>('AWS_S3_BUCKET');
    if (!bucketName) {
      throw new Error('Missing AWS_S3_BUCKET configuration');
    }
    this.bucketName = bucketName;
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const key = `${uuid()}-${file.originalname}`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return key;
  }

  async deleteFile(fileKey: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      }),
    );
  }

  async getFileAndDownload(fileKey: string): Promise<Buffer> {
    const res = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      }),
    );
    if (!res.Body) {
      throw new Error('Download failed: stream is null');
    }
    return this.streamToBuffer(res.Body);
  }

  private async streamToBuffer(
    stream: NonNullable<GetObjectCommandOutput['Body']>,
  ): Promise<Buffer> {
    return Buffer.from(await stream.transformToByteArray());
  }
}
