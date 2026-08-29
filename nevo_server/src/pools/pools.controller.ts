import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { CreatePoolDto } from './dto/create-pool.dto';
import { FilterPoolsDto } from './dto/filter-pools.dto';
import { PoolsService } from './pools.service';

export interface UpdatePoolDto {
  description?: string;
  imageUrl?: string;
  category?: string;
}

export interface WithdrawDto {
  requesterWallet: string;
}

@Controller('pools')
export class PoolsController {
  constructor(private readonly poolsService: PoolsService) {}

  @Get()
  async findAll(@Query(new ValidationPipe({ transform: true })) query: FilterPoolsDto) {
    return this.poolsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const pool = await this.poolsService.findOneMerged(id);
    if (!pool) throw new NotFoundException('Pool not found');
    return pool;
  }

  @Post()
  create(@Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CreatePoolDto) {
    return this.poolsService.create(dto);
  }

  @Patch(':id')
  async updateMeta(@Param('id') id: string, @Body() dto: UpdatePoolDto) {
    const pool = await this.poolsService.updateMeta(id, dto);
    if (!pool) throw new NotFoundException('Pool not found');
    return pool;
  }

  @Post(':id/withdraw')
  async withdraw(@Param('id') id: string, @Body() dto: WithdrawDto) {
    const pool = await this.poolsService.findByContractId(id);
    if (!pool) throw new NotFoundException('Pool not found');
    if (pool.creatorWallet !== dto.requesterWallet)
      throw new ForbiddenException('Only the pool creator may withdraw');
    return this.poolsService.buildWithdrawTx(pool);
  }
}
