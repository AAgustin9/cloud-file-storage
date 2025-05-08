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
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt.strategy';

interface AuthRequest extends Request {
  user: {
    sub: string;
    username: string;
    isAdmin: boolean;
  };
}

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully', type: String })
  uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: AuthRequest): Promise<string> {
    if (!req.user || !req.user.sub) {
      throw new NotFoundException('User authentication failed or user ID is missing');
    }
    const userId = req.user.sub;
    return this.filesService.uploadFile(file, userId);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a file' })
  @ApiResponse({ status: 200, description: 'File successfully retrieved' })
  getFile(@Param('key') fileKey: string, @Req() req: AuthRequest): Promise<string> {
    if (!req.user || !req.user.sub) {
      throw new NotFoundException('User authentication failed or user ID is missing');
    }
    const userId = req.user.sub;
    return this.filesService.getFile(fileKey, userId);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 204, description: 'File deleted successfully' })
  deleteFile(@Param('key') key: string, @Req() req: AuthRequest): Promise<void> {
    if (!req.user || !req.user.sub) {
      throw new NotFoundException('User authentication failed or user ID is missing');
    }
    const userId = req.user.sub;
    return this.filesService.delete(key, userId);
  }
}
