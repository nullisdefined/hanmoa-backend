import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T>> {
    return next.handle().pipe(
      map((data: T) => {
        // ApiResponseDto 형식이면 반환
        if (data && typeof data === 'object' && 'success' in data) {
          return data as ApiResponseDto<T>;
        }
        // 그렇지 않으면 감싸서 반환
        return ApiResponseDto.ok(data);
      }),
    );
  }
}
