import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { PoolsService } from './pools.service';

@Controller('pools')
export class PoolsController {
  constructor(private readonly poolsService: PoolsService) {}

  /**
   * Get all pools
   * Returns: { data: Pool[], pagination: {...}, success: true, timestamp: ... }
   */
  @Get()
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.poolsService.findAll(page, limit);
  }

  /**
   * Get a single pool
   * Returns: { data: Pool, success: true, timestamp: ... }
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.poolsService.findOne(id);
  }

  /**
   * Create a new pool
   * Returns: { data: Pool, success: true, timestamp: ... }
   */
  @Post()
  create(@Body() createPoolDto: any) {
    return this.poolsService.create(createPoolDto);
  }

  /**
   * Update a pool
   * Returns: { data: Pool, success: true, timestamp: ... }
   */
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePoolDto: any) {
    return this.poolsService.update(id, updatePoolDto);
  }

  /**
   * Delete a pool
   * Returns: { data: Pool, success: true, timestamp: ... }
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.poolsService.remove(id);
  }
}
