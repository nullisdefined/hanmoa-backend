import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DubJob } from 'src/entities/dub-job.entity';
import { Segment, SegmentStatus } from 'src/entities/segment.entity';
import { Repository } from 'typeorm';
import { SaveSegmentsDto } from './dto/save-segments.dto';

@Injectable()
export class WorkerService {
  constructor(
    @InjectRepository(Segment)
    private readonly segmentRepository: Repository<Segment>,
    @InjectRepository(DubJob)
    private readonly dubJobRepository: Repository<DubJob>,
  ) {}

  async saveSegments(jobId: string, dto: SaveSegmentsDto): Promise<Segment[]> {
    const dubJob = await this.dubJobRepository.findOne({
      where: { uuid: jobId },
    });

    if (!dubJob) {
      throw new NotFoundException('DubJob을 찾을 수 없습니다.');
    }

    const segments = dto.segments.map((seg) =>
      this.segmentRepository.create({
        dubJobId: dubJob.uuid,
        segmentIndex: seg.segmentIndex,
        startMs: seg.startMs,
        endMs: seg.endMs,
        videoSegmentS3Key: seg.videoSegmentS3Key,
        audioSegmentS3Key: seg.audioSegmentS3Key,
        status: SegmentStatus.PENDING,
        srcText: '', // STT 이전
      }),
    );

    return await this.segmentRepository.save(segments);
  }
}
