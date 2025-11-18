import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { VideoAsset } from './video-asset.entity';
import { DubJob } from './dub-job.entity';

@Entity('project')
export class Project extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user: User) => user.projects)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => VideoAsset, (videoAsset: VideoAsset) => videoAsset.project)
  videoAssets: VideoAsset[];

  @OneToMany(() => DubJob, (dubjob: DubJob) => dubjob.project)
  dubJobs: DubJob[];
}
