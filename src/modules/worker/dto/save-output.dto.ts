import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OutputType } from 'src/entities/output-asset.entity';

export class SaveOutputDto {
  @ApiProperty({
    description: '출력 파일 타입',
    enum: OutputType,
    example: 'video',
  })
  @IsEnum(OutputType)
  type: OutputType;

  @ApiProperty({
    description: 'S3 저장 키',
    example: 'outputs/job-123/final.mp4',
  })
  @IsString()
  s3Key: string;

  @ApiProperty({
    description: '파일 크기 (bytes)',
    example: 1024000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @ApiProperty({
    description: 'MIME 타입',
    example: 'video/mp4',
    required: false,
  })
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiProperty({
    description: '미디어 길이 (ms)',
    example: 120000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  durationMs?: number;
}
