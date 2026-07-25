import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Pool } from './pool.entity';
import { PoolsService } from './pools.service';
import { PoolsController } from './pools.controller';
import { ContractModule } from '../contract/contract.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pool]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret',
      signOptions: { expiresIn: '7d' },
    }),
    ContractModule,
  ],
  providers: [PoolsService],
  controllers: [PoolsController],
  exports: [PoolsService],
})
export class PoolsModule {}
