import { Controller } from '@nestjs/common';
import { DubJobsService } from './dub-jobs.service';

@Controller('dub-jobs')
export class DubJobsController {
  constructor(private readonly dubJobsService: DubJobsService) {}
}
