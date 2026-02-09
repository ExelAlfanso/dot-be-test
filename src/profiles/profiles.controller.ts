import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RoleGuard } from 'src/auth/role/role.guard';
import { Roles } from 'src/auth/role/roles.decorator';
import {
  ErrorResponseDto,
  UnauthorizedResponseDto,
} from '../common/dtos/error-response.dto';
import { ProfileDto } from './dtos/profile.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { ProfilesService } from './profiles.service';

@ApiTags('Profile')
@Controller('profile')
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('USER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns user profile',
    type: ProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedResponseDto,
  })
  async getProfile(@Request() req): Promise<ProfileDto> {
    return this.profilesService.getProfile(req.user.userId);
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('USER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns updated user profile',
    type: ProfileDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or duplicate data',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedResponseDto,
  })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileDto> {
    return this.profilesService.updateProfile(
      req.user.userId,
      updateProfileDto,
    );
  }
}
