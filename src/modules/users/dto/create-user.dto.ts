import { authProvider } from 'src/entities/user.entity';

export class CreateUserDto {
  email: string;
  nickname: string;
  avatarUrl: string;
  authProvider: authProvider;
  providerUserId: string;
}
