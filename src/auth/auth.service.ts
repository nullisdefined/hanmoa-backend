import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/modules/users/entities/user.entity';
import { UsersService } from 'src/modules/users/users.service';
import { ProfileDto } from './dto/profile.dto';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateOAuthUser(profile: ProfileDto): Promise<User> {
    const user = await this.usersService.findOrCreate({
      email: profile.email,
      nickname: profile.name,
      avatarUrl: profile.avatarUrl,
      authProvider: profile.provider,
      providerUserId: profile.providerId,
    });

    return user;
  }

  login(user: User): AuthResponse {
    const payload: JwtPayload = {
      sub: user.uuid,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }
}
