import { Module } from '@nestjs/common';
import { DubJobsService } from './dub-jobs.service';
import { DubJobsController } from './dub-jobs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DubJob } from 'src/entities/dub-job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DubJob])],
  controllers: [DubJobsController],
  providers: [DubJobsService],
  exports: [DubJobsService],
})
export class DubJobsModule {}
