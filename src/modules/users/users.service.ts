import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
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

  async findOne(uuid: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { uuid } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByProviderUserId(
    authProvider: string,
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
      existingUser.avatarUrl = userData.avartarUrl;
      return await this.userRepository.save(existingUser);
    }

    const newUser = this.userRepository.create(userData);
    return await this.userRepository.save(newUser);
  }

  async update(uuid: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.userRepository.update(uuid, updateUserDto);
    const updatedUser = await this.findOne(uuid);
    if (!updatedUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return updatedUser;
  }

  async remove(uuid: string): Promise<void> {
    await this.userRepository.delete(uuid);
  }
}
