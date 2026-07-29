import {
  Body,
  Controller,
  NotFoundException,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UsersService } from './users.service.js';
import { UpdateDisplayNameDto } from './dto/update-display-name.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(
    @Req() req: Request & { user: { publicKey: string } },
    @Body() dto: UpdateDisplayNameDto,
  ) {
    const user = await this.usersService.updateDisplayName(
      req.user.publicKey,
      dto.displayName.trim(),
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
