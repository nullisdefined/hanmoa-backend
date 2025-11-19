import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    example: 'My Project',
    required: true,
    description: '프로젝트명',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'This is my project',
    required: false,
    description: '프로젝트 설명',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
