import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ContractService } from './contract.service';

@Controller('contract')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  /**
   * Build a contribution transaction
   * Returns: { data: {...}, unsignedXdr: "...", success: true, timestamp: ... }
   */
  @Post('contribute')
  buildContribution(
    @Body()
    dto: {
      poolId: string;
      donor: string;
      amount: string;
      asset: 'XLM' | 'USDC';
    },
  ) {
    return this.contractService.buildContribution(
      dto.poolId,
      dto.donor,
      dto.amount,
      dto.asset,
    );
  }

  /**
   * Submit a signed transaction
   * Returns: { data: {...}, txHash: "0x...", success: true, timestamp: ... }
   */
  @Post('submit')
  submitTransaction(@Body() dto: { signedXdr: string }) {
    return this.contractService.submitTransaction(dto.signedXdr);
  }

  /**
   * Get contract state
   * Returns: { data: {...}, success: true, timestamp: ... }
   */
  @Get('state/:contractId')
  getContractState(@Param('contractId') contractId: string) {
    return this.contractService.getContractState(contractId);
  }

  /**
   * Call a contract method
   * Returns: { data: {...}, success: true, timestamp: ... }
   */
  @Post('call')
  callContractMethod(
    @Body()
    dto: {
      contractId: string;
      method: string;
      params: Record<string, unknown>;
    },
  ) {
    return this.contractService.callContractMethod(
      dto.contractId,
      dto.method,
      dto.params,
    );
  }
}
