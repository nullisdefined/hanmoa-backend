import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';
import { Segment } from './segment.entity';
import { Speaker } from './speaker.entity';
import { OutputAsset } from './output-asset.entity';
import { JobStep } from './job-step.entity';
import { Subtitle } from './subtitle.entity';

export enum DubJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('dub_job')
export class DubJob extends BaseEntity {
  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'video_asset_id' })
  videoAssetId: string;

  @Column({
    type: 'enum',
    enum: DubJobStatus,
    default: DubJobStatus.PENDING,
  })
  status: DubJobStatus;

  @Column({ name: 'src_lang', length: 10 })
  srcLang: string;

  @Column({ name: 'dst_lang', length: 10 })
  dstLang: string;

  @Column({ name: 'total_duration_ms', nullable: true })
  totalDurationMs: number;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Project, (project) => project.dubJobs)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => Segment, (segment) => segment.dubJob, { cascade: true })
  segments: Segment[];

  @OneToMany(() => Speaker, (speaker) => speaker.dubJob, { cascade: true })
  speakers: Speaker[];

  @OneToMany(() => OutputAsset, (outputAsset) => outputAsset.dubJob)
  outputs: OutputAsset[];

  @OneToMany(() => JobStep, (jobStep) => jobStep.dubJob, { cascade: true })
  steps: JobStep[];

  @OneToMany(() => Subtitle, (subtitle) => subtitle.dubJob, { cascade: true })
  subtitles: Subtitle[];
}
