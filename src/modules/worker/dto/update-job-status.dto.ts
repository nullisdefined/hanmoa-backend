import { IsEnum } from 'class-validator';
import { DubJobStatus } from 'src/entities/dub-job.entity';

export class UpdateJobStatusDto {
  @IsEnum(DubJobStatus)
  status: DubJobStatus;
}
