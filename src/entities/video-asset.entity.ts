import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';
import { DubJob } from './dub-job.entity';

export type lang = 'en' | 'ko';

@Entity('video_assets')
export class VideoAsset extends BaseEntity {
  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 's3_key' })
  s3Key: string;

  @Column({ name: 'src_lang' })
  srcLang: lang;

  @Column({ name: 'dst_lang' })
  dstLang: lang;

  @Column({ type: 'json', name: 'media_meta', nullable: true })
  mediaMeta: Record<string, any>;

  @ManyToOne(() => Project, (project) => project.videoAssets)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => DubJob, (dubJob: DubJob) => dubJob.videoAsset)
  dubJobs: DubJob[];
}
