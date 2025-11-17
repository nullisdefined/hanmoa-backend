import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DubJob } from './dub-job.entity';

export enum OutputType {
  VIDEO = 'video', // 최종 더빙된 비디오
  AUDIO = 'audio', // 오디오 트랙만
  SUBTITLE = 'subtitle', // 자막 파일 (SRT, VTT 등)
  TRANSCRIPT = 'transcript', // 대본
}

export enum OutputStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('output_asset')
export class OutputAsset extends BaseEntity {
  @Column({ name: 'dub_job_id' })
  dubJobId: string;

  @Column({
    type: 'enum',
    enum: OutputType,
  })
  type: OutputType;

  @Column({ name: 's3_key' })
  s3Key: string; // S3 저장 키

  @Column({ name: 'file_url' })
  fileUrl: string; // 다운로드 가능한 URL

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize: number; // 파일 크기 (bytes)

  @Column({ name: 'mime_type', nullable: true })
  mimeType: string; // MIME 타입 (e.g., 'video/mp4', 'audio/mpeg')

  @Column({
    type: 'enum',
    enum: OutputStatus,
    default: OutputStatus.PROCESSING,
  })
  status: OutputStatus;

  @Column({ name: 'duration_ms', nullable: true })
  durationMs: number; // 미디어 길이 (ms)

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => DubJob, (dubJob) => dubJob.outputs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'dub_job_id' })
  dubJob: DubJob;
}
