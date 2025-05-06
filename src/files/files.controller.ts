import { Controller, Post, UploadedFile } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FilesService } from './files.service';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @ApiOperation({ summary: 'Upload a file' })
  @ApiResponse({ status: 201, description: 'File successfully uploaded' })
  @ApiResponse({ status: 409, description: 'File already exists' })
  uploadFile(@UploadedFile() file: Express.Multer.File): Promise<string> {
    return this.filesService.uploadFile(file);
  }

  //TODO delete y getAndDownload
}
