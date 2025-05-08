export interface StorageInterface {
  upload(file: Express.Multer.File, key: string): Promise<string>;
  delete(fileKey: string): Promise<void>;
  getFile(fileKey: string): Promise<string>;
}
