import { Type } from 'class-transformer';
import {
  IsArray,
  IsString,
  IsOptional,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SegmentStatus } from 'src/entities/segment.entity';

class UpdateSegmentDto {
  @ApiProperty({
    description: '세그먼트 ID',
    example: '01KAG62QHCJKVR6XDFQ35B4F1T',
  })
  @IsString()
  segmentId: string;

  @ApiProperty({
    description: '원본 텍스트 (STT 결과)',
    example: '안녕하세요',
    required: false,
  })
  @IsString()
  @IsOptional()
  srcText?: string;

  @ApiProperty({
    description: '번역된 텍스트',
    example: 'Hello',
    required: false,
  })
  @IsString()
  @IsOptional()
  mtText?: string;

  @ApiProperty({
    description: '세그먼트 상태',
    enum: SegmentStatus,
    required: false,
  })
  @IsEnum(SegmentStatus)
  @IsOptional()
  status?: SegmentStatus;

  @ApiProperty({
    description: '화자 ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  speakerId?: string;

  @ApiProperty({
    description: '더빙된 오디오 URL',
    required: false,
  })
  @IsString()
  @IsOptional()
  audioUrl?: string;
}

export class UpdateSegmentsDto {
  @ApiProperty({
    description: '업데이트할 세그먼트 배열',
    type: [UpdateSegmentDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSegmentDto)
  segments: UpdateSegmentDto[];
}
