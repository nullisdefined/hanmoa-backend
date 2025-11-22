import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';
import { DubJob } from './dub-job.entity';

export type lang = 'en' | 'ko';
export type VideoStatus = 'uploading' | 'processing' | 'ready' | 'error';

@Entity('video_assets')
export class VideoAsset extends BaseEntity {
  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 's3_key' })
  s3Key: string;

  @Column({ name: 'src_lang', nullable: true })
  srcLang: lang;

  @Column({ name: 'dst_lang', nullable: true })
  dstLang: lang;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ name: 'mime_type', nullable: true })
  mimeType: string;

  @Column({
    type: 'varchar',
    default: 'uploading',
    enum: ['uploading', 'processing', 'ready', 'error'],
  })
  status: VideoStatus;

  @Column({ name: 'duration_sec', type: 'integer', nullable: true })
  durationSec: number;

  @Column({ type: 'json', name: 'media_meta', nullable: true })
  mediaMeta: Record<string, any>;

  @ManyToOne(() => Project, (project) => project.videoAssets)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => DubJob, (dubJob: DubJob) => dubJob.videoAsset)
  dubJobs: DubJob[];
}
