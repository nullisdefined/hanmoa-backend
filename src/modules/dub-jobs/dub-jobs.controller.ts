import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DubJobsService } from './dub-jobs.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserUuid } from 'src/common/decorators/user-uuid.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('dub-jobs')
@UseGuards(JwtAuthGuard)
@ApiTags('DubJobs')
@ApiBearerAuth()
export class DubJobsController {
  constructor(private readonly dubJobsService: DubJobsService) {}

  @Get(':jobId')
  @ApiOperation({ summary: '더빙 작업 상세 조회' })
  getJobDetail(@UserUuid() userId: string, @Param('jobId') jobId: string) {
    return this.dubJobsService.findOneWithAuth(userId, jobId);
  }

  @Get(':jobId/status')
  @ApiOperation({ summary: '더빙 작업 상태 조회' })
  async getJobStatus(
    @UserUuid() userId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.dubJobsService.getJobStatus(userId, jobId);
  }
}
