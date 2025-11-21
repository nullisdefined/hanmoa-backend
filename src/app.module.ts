import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { winstonConfig } from './config/logger.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { ProjectsModule } from './modules/projects/projects.module';
import { VideosModule } from './modules/videos/videos.module';
import { DubJobsModule } from './modules/dub-jobs/dub-jobs.module';
import { WorkerModule } from './modules/worker/worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig, jwtConfig],
    }),
    WinstonModule.forRoot(winstonConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database'),
    }),
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
      port: parseInt(process.env.DEVTOOLS_PORT, 10) || 4000,
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    VideosModule,
    DubJobsModule,
    WorkerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
