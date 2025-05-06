export interface CloudStorageProvider {
  uploadFile(file: Express.Multer.File): Promise<string>;
  deleteFile(fileKey: string): Promise<void>;
  getFileAndDownload(fileKey: string): Promise<Buffer>;
}
