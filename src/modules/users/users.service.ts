import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { authProvider, User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(uuid: string, currentUserUuid: string): Promise<User | null> {
    if (uuid !== currentUserUuid) {
      throw new ForbiddenException('본인의 정보만 조회할 수 있습니다.');
    }

    const user = await this.userRepository.findOne({ where: { uuid } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByProviderUserId(
    authProvider: authProvider,
    providerUserId: string,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: { authProvider, providerUserId },
    });
  }

  async findOrCreate(userData: CreateUserDto): Promise<User> {
    const existingUser = await this.findByProviderUserId(
      userData.authProvider,
      userData.providerUserId,
    );

    if (existingUser) {
      existingUser.email = userData.email;
      existingUser.nickname = userData.nickname;
      existingUser.avatarUrl = userData.avatarUrl;
      return await this.userRepository.save(existingUser);
    }

    // 같은 이메일로 다른 프로바이더에 가입된 사용자가 있는지 확인
    const userWithSameEmail = await this.findByEmail(userData.email);

    if (userWithSameEmail) {
      userWithSameEmail.authProvider = userData.authProvider;
      userWithSameEmail.providerUserId = userData.providerUserId;
      userWithSameEmail.nickname = userData.nickname;
      userWithSameEmail.avatarUrl = userData.avatarUrl;

      return await this.userRepository.save(userWithSameEmail);
    }

    const newUser = this.userRepository.create(userData);
    return await this.userRepository.save(newUser);
  }

  async update(
    uuid: string,
    updateUserDto: UpdateUserDto,
    currentUserUuid: string,
  ): Promise<User> {
    if (currentUserUuid !== uuid) {
      throw new ForbiddenException('본인의 정보만 수정할 수 있습니다.');
    }

    const existingUser = await this.userRepository.findOne({ where: { uuid } });
    if (!existingUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    await this.userRepository.update(uuid, updateUserDto);
    const updatedUser = await this.userRepository.findOne({ where: { uuid } });

    return updatedUser;
  }

  async remove(uuid: string, currentUserUuid: string): Promise<void> {
    if (currentUserUuid !== uuid) {
      throw new ForbiddenException('본인의 정보만 삭제할 수 있습니다.');
    }

    const existingUser = await this.userRepository.findOne({ where: { uuid } });
    if (!existingUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    await this.userRepository.delete(uuid);
  }
}
