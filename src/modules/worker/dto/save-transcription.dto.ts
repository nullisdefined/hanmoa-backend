import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsString,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class TranscriptionSegmentDto {
  @ApiProperty({
    description: '세그먼트 시작 시간 (초 단위)',
    example: 3.4528569999999945,
  })
  @IsNumber()
  start: number;

  @ApiProperty({
    description: '세그먼트 종료 시간 (초 단위)',
    example: 21.672856999999993,
  })
  @IsNumber()
  end: number;

  @ApiProperty({
    description: '원본 텍스트 (STT 결과)',
    example: 'In the country of Japan...',
  })
  @IsString()
  text: string;

  @ApiProperty({
    description: '번역된 텍스트',
    example: '일본에서는...',
  })
  @IsString()
  translated: string;

  @ApiProperty({
    description: '화자 레이블 (옵션)',
    example: 'speaker_1',
    required: false,
  })
  @IsString()
  @IsOptional()
  speakerLabel?: string;
}

export class SaveTranscriptionDto {
  @ApiProperty({
    description: 'STT + 번역 결과 세그먼트 배열',
    type: [TranscriptionSegmentDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranscriptionSegmentDto)
  segments: TranscriptionSegmentDto[];
}
