import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { WorkerService } from './worker.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DubJobsService } from '../dub-jobs/dub-jobs.service';
import { DubJobStatus } from 'src/entities/dub-job.entity';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { SaveTranscriptionDto } from './dto/save-transcription.dto';
import { SaveOutputDto } from './dto/save-output.dto';

@ApiTags('Worker')
@Controller('worker')
export class WorkerController {
  constructor(
    private readonly workerService: WorkerService,
    private readonly dubJobsService: DubJobsService,
  ) {}

  @ApiOperation({ summary: '대기 중인 더빙 작업 목록 조회' })
  @Get('jobs/pending')
  async getPendingJobs(
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    const jobs = await this.dubJobsService.findPendingJobs(limit);

    return jobs.map((job) => ({
      dubJobId: job.uuid,
      videoAssetId: job.videoAssetId,
      projectId: job.projectId,
      srcLang: job.srcLang,
      dstLang: job.dstLang,
      videoS3Key: job.videoAsset.s3Key,
      durationSec: job.videoAsset.durationSec,
      status: job.status,
      createdAt: job.createdAt,
    }));
  }

  @ApiOperation({ summary: '더빙 작업 처리 시작 선언' })
  @Post('jobs/:jobId/claim')
  async claimJob(@Param('jobId') jobId: string) {
    const dubJob = await this.dubJobsService.updateStatus(
      jobId,
      DubJobStatus.PROCESSING,
    );

    return {
      success: true,
      dubJobId: dubJob.uuid,
      status: dubJob.status,
    };
  }

  @ApiOperation({ summary: 'STT + 번역 결과 일괄 저장' })
  @Post('jobs/:jobId/segments')
  async saveSegments(
    @Param('jobId') jobId: string,
    @Body() saveTranscriptionDto: SaveTranscriptionDto,
  ) {
    const segments = await this.workerService.saveTranscription(
      jobId,
      saveTranscriptionDto,
    );

    return {
      success: true,
      segmentsSaved: segments.length,
      segments: segments.map((seg) => ({
        segmentId: seg.uuid,
        segmentIndex: seg.segmentIndex,
        start: seg.startMs / 1000,
        end: seg.endMs / 1000,
        text: seg.srcText,
        translated: seg.mtText,
        status: seg.status,
      })),
    };
  }

  @ApiOperation({ summary: '더빙 작업 상태 업데이트' })
  @Patch('jobs/:jobId/status')
  async updateJobStatus(
    @Param('jobId') jobId: string,
    @Body() updateJobStatusDto: UpdateJobStatusDto,
  ) {
    const dubJob = await this.dubJobsService.updateStatus(
      jobId,
      updateJobStatusDto.status,
    );

    return {
      success: true,
      dubJobId: dubJob.uuid,
      status: dubJob.status,
    };
  }

  @ApiOperation({ summary: '최종 결과물 저장' })
  @Post('jobs/:jobId/output')
  async saveOutput(
    @Param('jobId') jobId: string,
    @Body() saveOutputDto: SaveOutputDto,
  ) {
    const output = await this.workerService.saveOutput(jobId, saveOutputDto);

    return {
      success: true,
      output: {
        outputId: output.uuid,
        type: output.type,
        s3Key: output.s3Key,
        fileUrl: output.fileUrl,
        fileSize: output.fileSize,
        mimeType: output.mimeType,
        durationMs: output.durationMs,
        status: output.status,
      },
    };
  }
}
