import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DubJobStatus } from 'src/entities/dub-job.entity';

export class UpdateJobStatusDto {
  @ApiProperty({
    description: '작업 상태',
    enum: DubJobStatus,
    example: DubJobStatus.PROCESSING,
  })
  @IsEnum(DubJobStatus)
  status: DubJobStatus;
}
