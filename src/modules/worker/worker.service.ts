import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DubJob } from 'src/entities/dub-job.entity';
import { Segment, SegmentStatus } from 'src/entities/segment.entity';
import { Speaker } from 'src/entities/speaker.entity';
import { JobStep, StepType, StepStatus } from 'src/entities/job-step.entity';
import { Repository, In } from 'typeorm';
import { SaveSegmentsDto } from './dto/save-segments.dto';
import { UpdateSegmentsDto } from './dto/update-segments.dto';
import { SaveSpeakersDto } from './dto/save-speakers.dto';
import { UpdateJobStepDto } from './dto/update-job-step.dto';

@Injectable()
export class WorkerService {
  constructor(
    @InjectRepository(Segment)
    private readonly segmentRepository: Repository<Segment>,
    @InjectRepository(DubJob)
    private readonly dubJobRepository: Repository<DubJob>,
    @InjectRepository(Speaker)
    private readonly speakerRepository: Repository<Speaker>,
    @InjectRepository(JobStep)
    private readonly jobStepRepository: Repository<JobStep>,
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

  async updateSegments(
    jobId: string,
    dto: UpdateSegmentsDto,
  ): Promise<Segment[]> {
    const dubJob = await this.dubJobRepository.findOne({
      where: { uuid: jobId },
    });

    if (!dubJob) {
      throw new NotFoundException('DubJob을 찾을 수 없습니다.');
    }

    const segmentIds = dto.segments.map((s) => s.segmentId);
    const segments = await this.segmentRepository.find({
      where: {
        uuid: In(segmentIds),
        dubJobId: jobId,
      },
    });

    if (segments.length !== segmentIds.length) {
      throw new NotFoundException('일부 세그먼트를 찾을 수 없습니다.');
    }

    // 업데이트 매핑
    const updateMap = new Map(dto.segments.map((s) => [s.segmentId, s]));

    segments.forEach((segment) => {
      const update = updateMap.get(segment.uuid);
      if (update) {
        if (update.srcText !== undefined) segment.srcText = update.srcText;
        if (update.mtText !== undefined) segment.mtText = update.mtText;
        if (update.status !== undefined) segment.status = update.status;
        if (update.speakerId !== undefined)
          segment.speakerId = update.speakerId;
        if (update.audioUrl !== undefined) segment.audioUrl = update.audioUrl;
      }
    });

    return await this.segmentRepository.save(segments);
  }

  async saveSpeakers(jobId: string, dto: SaveSpeakersDto): Promise<Speaker[]> {
    const dubJob = await this.dubJobRepository.findOne({
      where: { uuid: jobId },
    });

    if (!dubJob) {
      throw new NotFoundException('DubJob을 찾을 수 없습니다.');
    }

    const speakers = dto.speakers.map((spk) =>
      this.speakerRepository.create({
        dubJobId: jobId,
        speakerLabel: spk.speakerLabel,
        clonedVoiceId: spk.clonedVoiceId,
        metadata: spk.metadata,
      }),
    );

    return await this.speakerRepository.save(speakers);
  }

  async updateJobStep(
    jobId: string,
    stepType: StepType,
    dto: UpdateJobStepDto,
  ): Promise<JobStep> {
    const dubJob = await this.dubJobRepository.findOne({
      where: { uuid: jobId },
    });

    if (!dubJob) {
      throw new NotFoundException('DubJob을 찾을 수 없습니다.');
    }

    let step = await this.jobStepRepository.findOne({
      where: {
        dubJobId: jobId,
        type: stepType,
      },
    });

    if (!step) {
      // 존재하지 않으면 새로 생성
      // 해당 job의 최대 stepOrder를 조회하여 자동 증가
      const maxStepOrder = await this.jobStepRepository
        .createQueryBuilder('step')
        .select('MAX(step.stepOrder)', 'max')
        .where('step.dubJobId = :jobId', { jobId })
        .getRawOne<{ max: number | null }>();

      const nextStepOrder = (maxStepOrder?.max ?? -1) + 1;

      step = this.jobStepRepository.create({
        dubJobId: jobId,
        type: stepType,
        status: dto.status,
        stepOrder: nextStepOrder,
      });
    }

    if (dto.status !== undefined) step.status = dto.status;
    if (dto.errorMessage !== undefined) step.errorMessage = dto.errorMessage;
    if (dto.result !== undefined) step.result = dto.result;

    if (dto.status === StepStatus.IN_PROGRESS && !step.startedAt) {
      step.startedAt = new Date();
    }

    if (dto.status === StepStatus.COMPLETED && !step.completedAt) {
      step.completedAt = new Date();
    }

    return await this.jobStepRepository.save(step);
  }
}
