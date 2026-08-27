import { Module } from '@nestjs/common';
import { ContractController } from './contract.controller.js';
import { ContractService } from './contract.service.js';
import { HorizonService } from './horizon.service.js';

@Module({
  controllers: [ContractController],
  providers: [ContractService, HorizonService],
  exports: [ContractService, HorizonService],
})
export class ContractModule {}
