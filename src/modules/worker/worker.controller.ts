import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { WorkerService } from './worker.service';
import { ApiTags } from '@nestjs/swagger';
import { DubJobsService } from '../dub-jobs/dub-jobs.service';
import { DubJobStatus } from 'src/entities/dub-job.entity';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { SaveSegmentsDto } from './dto/save-segments.dto';

@ApiTags('Worker')
@Controller('worker')
export class WorkerController {
  constructor(
    private readonly workerService: WorkerService,
    private readonly dubJobsService: DubJobsService,
  ) {}

  @Get('jobs/pending')
  async getPendingJobs(@Query('limit') limit: number = 10) {
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

  @Post('jobs/:jobId/segments')
  async saveSegments(
    @Param('jobId') jobId: string,
    @Body() saveSegmentsDto: SaveSegmentsDto,
  ) {
    const segments = await this.workerService.saveSegments(
      jobId,
      saveSegmentsDto,
    );

    return {
      success: true,
      segmentsCreated: segments.length,
      segments: segments.map((seg) => ({
        segmentId: seg.uuid,
        segmentIndex: seg.segmentIndex,
        startMs: seg.startMs,
        endMs: seg.endMs,
        videoSegmentS3Key: seg.videoSegmentS3Key,
      })),
    };
  }

  @Get('jobs/:jobId')
  async getJob(@Param('jobId') jobId: string) {
    const job = await this.dubJobsService.findOne(jobId);

    return {
      dubJobId: job.uuid,
      videoAssetId: job.videoAssetId,
      projectId: job.projectId,
      srcLang: job.srcLang,
      dstLang: job.dstLang,
      status: job.status,
      videoS3Key: job.videoAsset.s3Key,
      segments: job.segments.map((seg) => ({
        segmentId: seg.uuid,
        segmentIndex: seg.segmentIndex,
        startMs: seg.startMs,
        endMs: seg.endMs,
        videoSegmentS3Key: seg.videoSegmentS3Key,
        audioSegmentS3Key: seg.audioSegmentS3Key,
        status: seg.status,
      })),
    };
  }
}
