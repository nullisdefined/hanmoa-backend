import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from 'src/entities/project.entity';
import {
  ApiResponseDto,
  PaginatedResponseDto,
  PaginationMetaDto,
} from 'src/common/dto/api-response.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProjectsService {
  private cloudfrontDomain: string;

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly configService: ConfigService,
  ) {
    this.cloudfrontDomain = this.configService.get('AWS_CLOUDFRONT_DOMAIN');
  }

  async create(
    userId: string,
    createProjectDto: CreateProjectDto,
  ): Promise<Project> {
    const project = this.projectRepository.create({
      ...createProjectDto,
      userId,
    });
    return this.projectRepository.save(project);
  }

  async findAll(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponseDto<Project>> {
    const skip = (page - 1) * limit;

    const [projects, total] = await this.projectRepository.findAndCount({
      where: { userId },
      relations: ['videoAsset'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const meta: PaginationMetaDto = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return new PaginatedResponseDto(projects, meta);
  }

  async findOne(userId: string, uuid: string): Promise<any> {
    const project = await this.findOwnedProjectOrFail(uuid, userId);

    // VideoAsset에 CloudFront URL 추가
    const projectWithUrl = {
      ...project,
      videoAsset: project.videoAsset
        ? {
            ...project.videoAsset,
            videoUrl: `https://${this.cloudfrontDomain}/${project.videoAsset.s3Key}`,
          }
        : null,
    };

    return projectWithUrl;
  }

  async update(
    userId: string,
    uuid: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOwnedProjectForUpdateOrFail(uuid, userId);
    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  async remove(userId: string, uuid: string): Promise<ApiResponseDto<void>> {
    const project = await this.findOwnedProjectForUpdateOrFail(uuid, userId);
    await this.projectRepository.remove(project);
    return ApiResponseDto.ok(undefined, '프로젝트가 삭제되었습니다.');
  }

  private async findOwnedProjectOrFail(
    uuid: string,
    userId: string,
  ): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { uuid, userId },
      relations: [
        'videoAsset',
        'videoAsset.dubJobs',
        'videoAsset.dubJobs.segments',
        'videoAsset.dubJobs.segments.speaker',
        'videoAsset.dubJobs.speakers',
        'videoAsset.dubJobs.outputs',
        'videoAsset.dubJobs.steps',
      ],
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    return project;
  }

  private async findOwnedProjectForUpdateOrFail(
    uuid: string,
    userId: string,
  ): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { uuid, userId },
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    return project;
  }
}
