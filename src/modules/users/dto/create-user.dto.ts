export class CreateUserDto {
  email: string;
  nickname: string;
  avatarUrl: string;
  authProvider: string;
  providerUserId: string;
}
