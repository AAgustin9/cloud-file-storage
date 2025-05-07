import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import { StorageInterface } from './storage.interface';

@Injectable()
export class S3Provider implements StorageInterface {
  private s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });

  async upload(file: Express.Multer.File): Promise<string> {
    const key = `${uuid()}-${file.originalname}`;
    await this.s3
      .putObject({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
      .promise();

    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async delete(fileKey: string): Promise<void> {
    await this.s3
      .deleteObject({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: fileKey,
      })
      .promise();
  }

  async getFile(fileKey: string): Promise<string> {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: fileKey,
    };
    return this.s3.getSignedUrl('getObject', params);
  }
}
