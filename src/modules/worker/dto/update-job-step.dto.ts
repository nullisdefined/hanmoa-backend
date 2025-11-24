import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StepStatus } from 'src/entities/job-step.entity';

export class UpdateJobStepDto {
  @ApiProperty({
    description: '단계 상태',
    enum: StepStatus,
  })
  @IsEnum(StepStatus)
  status: StepStatus;

  @ApiProperty({
    description: '에러 메시지',
    required: false,
  })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiProperty({
    description: '결과 데이터',
    required: false,
  })
  @IsOptional()
  result?: Record<string, any>;
}
