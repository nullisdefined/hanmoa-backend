import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';

class SegmentDto {
  @IsNumber()
  segmentIndex: number;

  @IsNumber()
  startMs: number;

  @IsNumber()
  endMs: number;

  @IsString()
  videoSegmentS3Key: string;

  @IsString()
  audioSegmentS3Key?: string;
}

export class SaveSegmentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentDto)
  segments: SegmentDto[];
}
