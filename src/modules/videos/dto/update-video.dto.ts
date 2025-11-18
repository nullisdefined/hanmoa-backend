import { IsOptional, IsString } from 'class-validator';

export class completeUpload {
  @IsString()
  @IsOptional()
  srcLang?: string;
}
