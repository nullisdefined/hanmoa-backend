import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../modules/users/users.service';
import { User } from '../entities/user.entity';
import { ProfileDto } from './dto/profile.dto';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    uuid: 'user-uuid-123',
    email: 'test@example.com',
    nickname: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg',
    authProvider: 'github' as const,
    providerUserId: 'github-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    projects: [],
    generateUuid: jest.fn(),
  } as User;

  const mockUsersService = {
    findOrCreate: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateOAuthUser', () => {
    it('should validate and return user for valid GitHub profile', async () => {
      const profile: ProfileDto = {
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        provider: 'github',
        providerId: 'github-123',
      };

      mockUsersService.findOrCreate.mockResolvedValue(mockUser);

      const result = await service.validateOAuthUser(profile);

      expect(usersService.findOrCreate).toHaveBeenCalledWith({
        email: profile.email,
        nickname: profile.name,
        avatarUrl: profile.avatarUrl,
        authProvider: profile.provider,
        providerUserId: profile.providerId,
      });
      expect(result).toEqual(mockUser);
    });

    it('should validate and return user for valid Google profile', async () => {
      const profile: ProfileDto = {
        email: 'google@example.com',
        name: 'Google User',
        avatarUrl: 'https://example.com/google-avatar.jpg',
        provider: 'google',
        providerId: 'google-456',
      };

      const googleUser = {
        ...mockUser,
        authProvider: 'google',
        providerUserId: 'google-456',
      };
      mockUsersService.findOrCreate.mockResolvedValue(googleUser);

      const result = await service.validateOAuthUser(profile);

      expect(usersService.findOrCreate).toHaveBeenCalledWith({
        email: profile.email,
        nickname: profile.name,
        avatarUrl: profile.avatarUrl,
        authProvider: profile.provider,
        providerUserId: profile.providerId,
      });
      expect(result).toEqual(googleUser);
    });

    it('should handle user creation when user does not exist', async () => {
      const profile: ProfileDto = {
        email: 'new@example.com',
        name: 'New User',
        avatarUrl: 'https://example.com/new-avatar.jpg',
        provider: 'github',
        providerId: 'github-new',
      };

      const newUser = { ...mockUser, email: 'new@example.com' };
      mockUsersService.findOrCreate.mockResolvedValue(newUser);

      const result = await service.validateOAuthUser(profile);

      expect(result).toEqual(newUser);
    });

    it('should propagate errors from usersService', async () => {
      const profile: ProfileDto = {
        email: 'error@example.com',
        name: 'Error User',
        avatarUrl: null,
        provider: 'github',
        providerId: 'github-error',
      };

      mockUsersService.findOrCreate.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.validateOAuthUser(profile)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('login', () => {
    it('should generate JWT token and return auth response', () => {
      const mockToken = 'jwt-token-123';
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = service.login(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.uuid,
        email: mockUser.email,
      });
      expect(result).toEqual({
        accessToken: mockToken,
        user: mockUser,
      });
    });

    it('should generate different tokens for different users', () => {
      const anotherUser = {
        ...mockUser,
        uuid: 'user-uuid-456',
        email: 'another@example.com',
      } as User;
      const token1 = 'token-1';
      const token2 = 'token-2';

      mockJwtService.sign
        .mockReturnValueOnce(token1)
        .mockReturnValueOnce(token2);

      const result1 = service.login(mockUser);
      const result2 = service.login(anotherUser);

      expect(result1.accessToken).toBe(token1);
      expect(result2.accessToken).toBe(token2);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should include correct JWT payload structure', () => {
      mockJwtService.sign.mockReturnValue('token');

      service.login(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: expect.any(String),
        email: expect.any(String),
      });
    });

    it('should return user object along with token', () => {
      mockJwtService.sign.mockReturnValue('token');

      const result = service.login(mockUser);

      expect(result.user).toBe(mockUser);
      expect(result.user.uuid).toBe(mockUser.uuid);
      expect(result.user.email).toBe(mockUser.email);
    });
  });
});
