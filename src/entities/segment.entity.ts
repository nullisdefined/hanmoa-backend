import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DubJob } from './dub-job.entity';
import { Speaker } from './speaker.entity';

export enum SegmentStatus {
  PENDING = 'pending',
  TRANSLATED = 'translated',
  DUBBED = 'dubbed',
  APPROVED = 'approved',
}

@Entity('segment')
export class Segment extends BaseEntity {
  @Column({ name: 'segment_index' })
  segmentIndex: number;

  @Column({ name: 'video_segment_s3_key', nullable: true })
  videoSegmentS3Key: string; // 비디오 세그먼트 S3 경로

  @Column({ name: 'audio_segment_s3_key', nullable: true })
  audioSegmentS3Key: string; // 오디오 세그먼트 S3 경로

  @Column({ name: 'dub_job_id' })
  dubJobId: string;

  @Column({ name: 'speaker_id', nullable: true })
  speakerId: string;

  @Column({ name: 'start_ms' })
  startMs: number; // 시작 시간 (ms)

  @Column({ name: 'end_ms' })
  endMs: number; // 종료 시간 (ms)

  @Column({ name: 'src_text', type: 'text' })
  srcText: string; // 원본 텍스트

  @Column({ name: 'mt_text', type: 'text', nullable: true })
  mtText: string; // 번역된 텍스트

  @Column({ name: 'user_edited_text', type: 'text', nullable: true })
  userEditedText: string; // 수정된 텍스트

  @Column({
    type: 'enum',
    enum: SegmentStatus,
    default: SegmentStatus.PENDING,
  })
  status: SegmentStatus;

  @Column({ name: 'audio_url', nullable: true })
  audioUrl: string; // 더빙된 오디오 파일 URL

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => DubJob, (dubJob) => dubJob.segments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'dub_job_id' })
  dubJob: DubJob;

  @ManyToOne(() => Speaker, (speaker: Speaker) => speaker.segments, {
    nullable: true,
  })
  @JoinColumn({ name: 'speaker_id' })
  speaker: Speaker;
}
