import { Module } from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { Project } from 'src/entities/project.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoAsset } from 'src/entities/video-asset.entity';
import { DubJobsModule } from '../dub-jobs/dub-jobs.module';
import { WinstonModule } from 'nest-winston';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, VideoAsset]),
    DubJobsModule,
    WinstonModule,
  ],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule {}
