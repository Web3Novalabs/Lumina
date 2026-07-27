import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PoolsService } from './pools.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ContractService } from '../contract/contract.service.js';
import { CreatePoolDto } from './dto/create-pool.dto.js';
import { DonatePoolDto } from './dto/donate-pool.dto.js';
import { FilterPoolsDto } from './dto/filter-pools.dto.js';
import { UpdatePoolDto } from './dto/update-pool.dto.js';

interface JwtPayload {
  sub: string;
  publicKey: string;
}

@Controller('pools')
export class PoolsController {
  constructor(
    private readonly poolsService: PoolsService,
    private readonly contractService: ContractService,
  ) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const pool = await this.poolsService.findOneMerged(id);
    if (!pool) throw new NotFoundException('Pool not found');
    return pool;
  }

  @Get()
  async findAll(@Query() query: FilterPoolsDto) {
    return this.poolsService.findAll(query);
  }

  @Post()
  create(@Body() dto: CreatePoolDto) {
    return this.poolsService.create(dto);
  }

  @Patch(':id')
  async updateMeta(@Param('id') id: string, @Body() dto: UpdatePoolDto) {
    const pool = await this.poolsService.updateMeta(id, dto);
    if (!pool) throw new NotFoundException('Pool not found');
    return pool;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/withdraw')
  async withdraw(
    @Param('id') id: string,
    @Req() req: { user: { publicKey: string } },
  ) {
    const pool = await this.poolsService.findByContractId(id);
    if (!pool) throw new NotFoundException('Pool not found');
    if (pool.creatorWallet !== req.user.publicKey) {
      throw new ForbiddenException('Only the pool creator may withdraw');
    }
    return this.poolsService.buildWithdrawTx(pool);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/close')
  async close(
    @Param('id') id: string,
    @Req() req: { user: { publicKey: string } },
  ) {
    const pool = await this.poolsService.findByContractId(id);
    if (!pool) throw new NotFoundException('Pool not found');
    if (pool.creatorWallet !== req.user.publicKey) {
      throw new ForbiddenException('Only the pool creator may close this pool');
    }
    return this.poolsService.buildClosePoolTx(pool);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/donate')
  async donate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DonatePoolDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const pool = await this.poolsService.findByContractId(String(id));
    if (!pool) throw new NotFoundException('Pool not found');

    const unsignedXdr = this.contractService.buildDonateTransaction(
      req.user.publicKey,
      id,
      String(dto.amount),
    );
    return { unsignedXdr };
  }
}
