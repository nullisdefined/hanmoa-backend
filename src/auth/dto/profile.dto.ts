import { authProvider } from 'src/entities/user.entity';

export class ProfileDto {
  provider: authProvider;
  providerId: string;
  email: string;
  name: string;
  avatarUrl: string;
}
