import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetProjectsQueryDto } from './dto/get-projects-query.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('Projects')
@UseGuards(JwtAuthGuard)
@ApiTags('projects')
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(req.user.userId, createProjectDto);
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetProjectsQueryDto,
  ) {
    const { page = 1, limit = 20 } = query;
    return this.projectsService.findAll(req.user.userId, page, limit);
  }

  @Get(':projectId')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.findOne(req.user.userId, projectId);
  }

  @Patch(':projectId')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(
      req.user.userId,
      projectId,
      updateProjectDto,
    );
  }

  @Delete(':projectId')
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.remove(req.user.userId, projectId);
  }
}
