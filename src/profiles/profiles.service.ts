import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { ProfileDto } from './dtos/profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string): Promise<ProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileDto> {
    const { username, email, password } = updateProfileDto;

    if (!username && !email && !password) {
      throw new BadRequestException('No data to update');
    }

    if (email) {
      const emailExists = await this.prisma.user.findFirst({
        where: { email, id: { not: userId } },
      });
      if (emailExists) {
        throw new BadRequestException('Email already in use');
      }
    }

    if (username) {
      const usernameExists = await this.prisma.user.findFirst({
        where: { username, id: { not: userId } },
      });
      if (usernameExists) {
        throw new BadRequestException('Username already in use');
      }
    }

    const data: { username?: string; email?: string; password?: string } = {};

    if (username) {
      data.username = username;
    }

    if (email) {
      data.email = email;
    }

    if (password) {
      data.password = await this.hashPassword(password);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, username: true, email: true, role: true },
    });

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }
}
