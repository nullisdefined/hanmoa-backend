import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetProjectsQueryDto } from './dto/get-projects-query.dto';
import { UserUuid } from 'src/common/decorators/user-uuid.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiTags('Projects')
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: '프로젝트 생성' })
  create(
    @UserUuid() userId: string,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(userId, createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: '프로젝트 목록 조회' })
  findAll(@UserUuid() userId: string, @Query() query: GetProjectsQueryDto) {
    const { page, limit } = query;
    return this.projectsService.findAll(userId, page, limit);
  }

  @Get(':projectId')
  @ApiOperation({ summary: '프로젝트 상세 조회' })
  findOne(@UserUuid() userId: string, @Param('projectId') projectId: string) {
    return this.projectsService.findOne(userId, projectId);
  }

  @Patch(':projectId')
  @ApiOperation({ summary: '프로젝트 수정' })
  update(
    @UserUuid() userId: string,
    @Param('projectId') projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(userId, projectId, updateProjectDto);
  }

  @Delete(':projectId')
  @ApiOperation({ summary: '프로젝트 삭제' })
  remove(@UserUuid() userId: string, @Param('projectId') projectId: string) {
    return this.projectsService.remove(userId, projectId);
  }
}
