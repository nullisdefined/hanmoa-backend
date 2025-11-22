import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsString,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class SegmentDto {
  @ApiProperty({
    description: '세그먼트 인덱스 (0부터 시작)',
    example: 0,
  })
  @IsNumber()
  segmentIndex: number;

  @ApiProperty({
    description: '세그먼트 시작 시간 (밀리초)',
    example: 0,
  })
  @IsNumber()
  startMs: number;

  @ApiProperty({
    description: '세그먼트 종료 시간 (밀리초)',
    example: 30000,
  })
  @IsNumber()
  endMs: number;

  @ApiProperty({
    description: '비디오 세그먼트 파일 S3 경로',
    example:
      'dub-jobs/01KAG62QHCJKVR6XDFQ35B4F1T/segments/video/01KAG62QPS47VGD44N52Q6SK19_seg000_0-30000.mp4',
  })
  @IsString()
  videoSegmentS3Key: string;

  @ApiProperty({
    description: '오디오 세그먼트 파일 S3 경로',
    example:
      'dub-jobs/01KAG62QHCJKVR6XDFQ35B4F1T/segments/audio/01KAG62QPS47VGD44N52Q6SK19_seg000_0-30000.wav',
    required: false,
  })
  @IsString()
  @IsOptional()
  audioSegmentS3Key?: string;
}

export class SaveSegmentsDto {
  @ApiProperty({
    description: '저장할 세그먼트 메타데이터 배열',
    type: [SegmentDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentDto)
  segments: SegmentDto[];
}
