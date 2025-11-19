import { Body, Controller, Post, Query, UseGuards } from '@nestjs/common';
import { VideosService } from './videos.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserUuid } from 'src/common/decorators/user-uuid.decorator';
import { UploadUrlRequestDto } from './dto/upload-url-request.dto';

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
}
