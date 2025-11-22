import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { WorkerController } from './worker.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Segment } from 'src/entities/segment.entity';
import { DubJob } from 'src/entities/dub-job.entity';
import { DubJobsModule } from '../dub-jobs/dub-jobs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Segment, DubJob]), DubJobsModule],
  controllers: [WorkerController],
  providers: [WorkerService],
})
export class WorkerModule {}
