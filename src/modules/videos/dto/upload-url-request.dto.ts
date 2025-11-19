import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UploadUrlRequestDto {
  @ApiProperty({
    example: 'video.mp4',
    description: '업로드 파일명',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    example: 'video/mp4',
    description: '업로드 파일 타입',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  contentType: string;
}
