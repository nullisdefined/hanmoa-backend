import { IsNotEmpty, IsString } from 'class-validator';

export class UploadUrlRequestDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;
}
