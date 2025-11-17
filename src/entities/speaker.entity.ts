import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DubJob } from './dub-job.entity';
import { Segment } from './segment.entity';

@Entity('speaker')
export class Speaker extends BaseEntity {
  @Column({ name: 'dub_job_id' })
  dubJobId: string;

  @Column({ name: 'speaker_label', length: 50 })
  speakerLabel: string; // 화자 레이블 (e.g., 'speaker-1', 'speaker-2')

  @Column({ name: 'cloned_voice_id', nullable: true })
  clonedVoiceId: string; // 원본 음색을 유지한 음성 아이디

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => DubJob, (dubJob) => dubJob.speakers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'dub_job_id' })
  dubJob: DubJob;

  @OneToMany(() => Segment, (segment) => segment.speaker)
  segments: Segment[];
}
