import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DubJob } from './dub-job.entity';

export enum SubtitleLanguage {
  SOURCE = 'source',
  TARGET = 'target',
  DUAL = 'dual', // 이중 자막
}

@Entity('subtitle')
export class Subtitle extends BaseEntity {
  @Column({ name: 'dub_job_id' })
  dubJobId: string;

  @Column({
    type: 'enum',
    enum: SubtitleLanguage,
  })
  language: SubtitleLanguage;

  @Column({ name: 's3_key' })
  s3Key: string;

  @Column({ name: 'file_url' })
  fileUrl: string;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ name: 'segment_count', nullable: true })
  segmentCount: number;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => DubJob, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dub_job_id' })
  dubJob: DubJob;
}
