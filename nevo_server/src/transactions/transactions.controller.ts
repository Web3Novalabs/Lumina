import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { ContractService } from '../contract/contract.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

export class SubmitXdrDto {
  @IsString()
  @IsNotEmpty()
  xdr!: string;
}

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly contractService: ContractService) {}

  @UseGuards(JwtAuthGuard)
  @Post('submit')
  async submit(@Body() dto: SubmitXdrDto): Promise<{ txHash: string }> {
    const txHash = await this.contractService.submitSignedXdr(dto.xdr);
    return { txHash };
  }
}
