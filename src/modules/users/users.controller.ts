import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiTags('Users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: '사용자 생성' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: '사용자 목록 조회' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':uuid')
  @ApiOperation({ summary: '사용자 상세 조회' })
  findOne(@Param('uuid') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':uuid')
  @ApiOperation({ summary: '사용자 수정' })
  update(@Param('uuid') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':uuid')
  @ApiOperation({ summary: '사용자 삭제' })
  remove(@Param('uuid') id: string) {
    return this.usersService.remove(id);
  }
}
