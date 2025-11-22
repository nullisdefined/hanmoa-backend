import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideosService } from './videos.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserUuid } from 'src/common/decorators/user-uuid.decorator';
import { UploadUrlRequestDto } from './dto/upload-url-request.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';

@Controller('videos')
@UseGuards(JwtAuthGuard)
@ApiTags('Videos')
@ApiBearerAuth()
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'S3 Presigned URL 생성' })
  async getUploadUrl(
    @UserUuid() userId: string,
    @Query('projectId') projectId: string,
    @Body() uploadUrlRequestDto: UploadUrlRequestDto,
  ) {
    return this.videosService.getUploadUrl(
      userId,
      projectId,
      uploadUrlRequestDto,
    );
  }

  @Patch(':videoId/complete')
  @ApiOperation({ summary: '업로드 완료 처리' })
  async completeUpload(
    @UserUuid() userId: string,
    @Param('videoId') videoId: string,
    @Body() completeUploadDto: CompleteUploadDto,
  ) {
    return this.videosService.completeUpload(
      userId,
      videoId,
      completeUploadDto,
    );
  }

  @Post('direct-upload')
  @ApiOperation({ summary: '비디오 업로드 테스트' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'projectId', 'srcLang', 'dstLang'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '업로드할 비디오 파일',
        },
        projectId: {
          type: 'string',
          description: '프로젝트 ID',
          example: '01KAG62QHCJKVR6XDFQ35B4F1T',
        },
        srcLang: {
          type: 'string',
          enum: ['ko', 'en'],
          description: '원본 언어',
          example: 'ko',
        },
        dstLang: {
          type: 'string',
          enum: ['ko', 'en'],
          description: '목표 언어',
          example: 'en',
        },
        durationSec: {
          type: 'number',
          description: '비디오 길이 (초)',
          example: 120,
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async directUpload(
    @UserUuid() userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('projectId') projectId: string,
    @Body('srcLang') srcLang: 'ko' | 'en',
    @Body('dstLang') dstLang: 'ko' | 'en',
    @Body('durationSec') durationSec?: number,
  ) {
    return this.videosService.directUpload(
      userId,
      file,
      projectId,
      srcLang,
      dstLang,
      durationSec ? Number(durationSec) : undefined,
    );
  }
}
