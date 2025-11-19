import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { lang } from 'src/entities/video-asset.entity';

export class CompleteUploadDto {
  @ApiProperty({
    example: 'en',
    description: '원본 언어',
    required: true,
  })
  @IsNotEmpty()
  srcLang: lang;

  @ApiProperty({
    example: 'ko',
    description: '번역된 언어',
    required: true,
  })
  @IsNotEmpty()
  dstLang: lang;

  @ApiProperty({
    example: 300,
    description: '영상 길이(초)',
    required: true,
  })
  @IsOptional()
  @IsNumber()
  durationSec?: number;
}
