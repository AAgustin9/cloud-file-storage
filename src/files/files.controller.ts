import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt.strategy';

interface AuthRequest extends Request {
  user: {
    id: string;
    username: string;
    role: string;
  };
}

@ApiTags('files')
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiResponse({ status: 201, description: 'File successfully uploaded' })
  @ApiResponse({ status: 409, description: 'File already exists' })
  uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: AuthRequest): Promise<string> {
    const userId = req.user.id;
    return this.filesService.uploadFile(file, userId);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a file' })
  @ApiResponse({ status: 200, description: 'File successfully retrieved' })
  getFile(@Param('key') fileKey: string, @Req() req: AuthRequest): Promise<string> {
    const userId = req.user.id;
    return this.filesService.getFile(fileKey, userId);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 204, description: 'File deleted successfully' })
  deleteFile(@Param('key') key: string, @Req() req: AuthRequest): Promise<void> {
    const userId = req.user.id;
    return this.filesService.delete(key, userId);
  }
}
