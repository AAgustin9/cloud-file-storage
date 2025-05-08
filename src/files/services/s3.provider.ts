import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import { StorageInterface } from './storage.interface';

@Injectable()
export class S3Provider implements StorageInterface {
  private s3: AWS.S3;
  private readonly logger = new Logger(S3Provider.name);
  private readonly bucketName: string;
  private readonly region: string;
  private readonly isConfigured: boolean;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.bucketName = process.env.AWS_S3_BUCKET || '';
    
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    
    this.isConfigured = !!(this.bucketName && accessKeyId && secretAccessKey);
    
    if (this.isConfigured) {
      this.s3 = new AWS.S3({
        region: this.region,
        accessKeyId,
        secretAccessKey,
      });
    } else {
      this.logger.warn('AWS S3 is not properly configured. Check your environment variables.');
    }
  }

  async upload(file: Express.Multer.File): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('AWS S3 is not configured. Please check your environment variables: AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
    }
    
    const key = `${uuid()}-${file.originalname}`;
    await this.s3
      .putObject({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
      .promise();

    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async delete(fileKey: string): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('AWS S3 is not configured. Please check your environment variables: AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
    }
    
    await this.s3
      .deleteObject({
        Bucket: this.bucketName,
        Key: fileKey,
      })
      .promise();
  }

  async getFile(fileKey: string): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('AWS S3 is not configured. Please check your environment variables: AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
    }
    
    const params = {
      Bucket: this.bucketName,
      Key: fileKey,
    };
    return this.s3.getSignedUrl('getObject', params);
  }
}
