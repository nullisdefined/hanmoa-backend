import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DubJob } from './dub-job.entity';

export enum StepType {
  UPLOAD = 'upload', // 비디오 업로드
  EXTRACT_AUDIO = 'extract_audio', // 오디오 추출
  STT = 'stt', // Speech-to-Text
  DIARIZATION = 'diarization', // 화자 분리
  TRANSLATION = 'translation', // 번역
  TTS = 'tts', // Text-to-Speech
  AUDIO_MIXING = 'audio_mixing', // 오디오 믹싱
  VIDEO_RENDERING = 'video_rendering', // 최종 비디오 렌더링
}

export enum StepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('job_step')
export class JobStep extends BaseEntity {
  @Column({ name: 'dub_job_id' })
  dubJobId: string;

  @Column({
    type: 'enum',
    enum: StepType,
  })
  type: StepType; // 단계 타입

  @Column({
    type: 'enum',
    enum: StepStatus,
    default: StepStatus.PENDING,
  })
  status: StepStatus;

  @Column({ name: 'step_order' })
  stepOrder: number; // 실행 순서

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'json', nullable: true })
  result: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => DubJob, (dubJob) => dubJob.steps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'dub_job_id' })
  dubJob: DubJob;
}
