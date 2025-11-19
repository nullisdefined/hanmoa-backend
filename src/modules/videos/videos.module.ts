import { Module } from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { Project } from 'src/entities/project.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoAsset } from 'src/entities/video-asset.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, VideoAsset])],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule {}
