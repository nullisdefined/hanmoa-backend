import { Type } from 'class-transformer';
import { IsArray, IsString, IsOptional, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class SpeakerDto {
  @ApiProperty({
    description: '화자 레이블',
    example: 'speaker-1',
  })
  @IsString()
  speakerLabel: string;

  @ApiProperty({
    description: '클론된 음성 ID',
    example: 'voice_abc123',
    required: false,
  })
  @IsString()
  @IsOptional()
  clonedVoiceId?: string;

  @ApiProperty({
    description: '추가 메타데이터',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SaveSpeakersDto {
  @ApiProperty({
    description: '저장할 화자 정보 배열',
    type: [SpeakerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpeakerDto)
  speakers: SpeakerDto[];
}
