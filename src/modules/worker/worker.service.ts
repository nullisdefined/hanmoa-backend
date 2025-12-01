import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DubJob } from 'src/entities/dub-job.entity';
import { Segment, SegmentStatus } from 'src/entities/segment.entity';
import { Speaker } from 'src/entities/speaker.entity';
import { JobStep, StepType, StepStatus } from 'src/entities/job-step.entity';
import { OutputAsset, OutputStatus } from 'src/entities/output-asset.entity';
import { Repository } from 'typeorm';
import { SaveTranscriptionDto } from './dto/save-transcription.dto';
import { SaveOutputDto } from './dto/save-output.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WorkerService {
  private cloudfrontDomain: string;

  constructor(
    @InjectRepository(Segment)
    private readonly segmentRepository: Repository<Segment>,
    @InjectRepository(DubJob)
    private readonly dubJobRepository: Repository<DubJob>,
    @InjectRepository(Speaker)
    private readonly speakerRepository: Repository<Speaker>,
    @InjectRepository(JobStep)
    private readonly jobStepRepository: Repository<JobStep>,
    @InjectRepository(OutputAsset)
    private readonly outputAssetRepository: Repository<OutputAsset>,
    private readonly configService: ConfigService,
  ) {
    this.cloudfrontDomain = this.configService.get('AWS_CLOUDFRONT_DOMAIN');
  }

  /**
   * STT + 번역 파이프라인 결과를 세그먼트로 저장
   * - 기존 세그먼트가 있으면 업데이트, 없으면 새로 생성
   * - 시간 단위: 초(float) → 밀리초(int) 변환
   */
  async saveTranscription(
    jobId: string,
    dto: SaveTranscriptionDto,
  ): Promise<Segment[]> {
    const dubJob = await this.dubJobRepository.findOne({
      where: { uuid: jobId },
    });

    if (!dubJob) {
      throw new NotFoundException('DubJob을 찾을 수 없습니다.');
    }

    // 기존 세그먼트 조회 (segmentIndex 순서로 매칭)
    const existingSegments = await this.segmentRepository.find({
      where: { dubJobId: jobId },
      order: { segmentIndex: 'ASC' },
    });

    const segments: Segment[] = [];

    for (let i = 0; i < dto.segments.length; i++) {
      const seg = dto.segments[i];
      const startMs = Math.round(seg.start * 1000);
      const endMs = Math.round(seg.end * 1000);

      let segment: Segment;

      // 기존 세그먼트가 있으면 업데이트
      if (existingSegments[i]) {
        segment = existingSegments[i];
        segment.startMs = startMs;
        segment.endMs = endMs;
        segment.srcText = seg.text;
        segment.mtText = seg.translated;
        segment.status = SegmentStatus.TRANSLATED;
      } else {
        // 없으면 새로 생성
        segment = this.segmentRepository.create({
          dubJobId: jobId,
          segmentIndex: i,
          startMs,
          endMs,
          srcText: seg.text,
          mtText: seg.translated,
          status: SegmentStatus.TRANSLATED,
        });
      }

      // 화자 레이블이 있으면 매칭
      if (seg.speakerLabel) {
        const speaker = await this.speakerRepository.findOne({
          where: {
            dubJobId: jobId,
            speakerLabel: seg.speakerLabel,
          },
        });
        if (speaker) {
          segment.speakerId = speaker.uuid;
        }
      }

      segments.push(segment);
    }

    return await this.segmentRepository.save(segments);
  }

  /**
   * 더빙 작업의 최종 결과물 저장
   */
  async saveOutput(jobId: string, dto: SaveOutputDto): Promise<OutputAsset> {
    const dubJob = await this.dubJobRepository.findOne({
      where: { uuid: jobId },
    });

    if (!dubJob) {
      throw new NotFoundException('DubJob을 찾을 수 없습니다.');
    }

    const fileUrl = `https://${this.cloudfrontDomain}/${dto.s3Key}`;

    const outputAsset = this.outputAssetRepository.create({
      dubJobId: jobId,
      type: dto.type,
      s3Key: dto.s3Key,
      fileUrl,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      durationMs: dto.durationMs,
      status: OutputStatus.COMPLETED,
    });

    return await this.outputAssetRepository.save(outputAsset);
  }
}
