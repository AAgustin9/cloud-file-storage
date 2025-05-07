export interface StorageInterface {
  upload(file: Express.Multer.File): Promise<string>;
  delete(fileKey: string): Promise<void>;
  getFile(fileKey: string): Promise<string>;
}
