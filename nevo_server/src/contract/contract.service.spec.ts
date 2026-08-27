import { Test, TestingModule } from '@nestjs/testing';
import { ContractService } from './contract.service';
import { ApiResponseDto } from '@/common/dto/api-response.dto';

describe('ContractService', () => {
  let service: ContractService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContractService],
    }).compile();

    service = module.get<ContractService>(ContractService);
  });

  describe('buildContribution', () => {
    it('should return response with unsignedXdr', () => {
      const result = service.buildContribution(
        '1',
        'GADDRESS',
        '100',
        'XLM',
      ) as ApiResponseDto;

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.unsignedXdr).toBeDefined();
      expect(result.data).toHaveProperty('status', 'prepared');
    });

    it('should include all parameters in response data', () => {
      const result = service.buildContribution(
        '42',
        'GADDRESS123',
        '500',
        'USDC',
      ) as ApiResponseDto;

      expect(result.data).toMatchObject({
        poolId: '42',
        donor: 'GADDRESS123',
        amount: '500',
        asset: 'USDC',
      });
    });
  });

  describe('submitTransaction', () => {
    it('should return response with txHash', () => {
      const result = service.submitTransaction('xdr...') as ApiResponseDto;

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.txHash).toBeDefined();
      expect(result.txHash).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('should set status to submitted', () => {
      const result = service.submitTransaction('xdr...') as ApiResponseDto;

      expect(result.data).toHaveProperty('status', 'submitted');
    });
  });

  describe('getContractState', () => {
    it('should return contract state', () => {
      const result = service.getContractState('CONTRACT123');

      expect(result).toHaveProperty('contractId', 'CONTRACT123');
      expect(result).toHaveProperty('totalFunded');
      expect(result).toHaveProperty('activePools');
      expect(result).toHaveProperty('lastUpdated');
    });
  });

  describe('callContractMethod', () => {
    it('should return method call result', () => {
      const result = service.callContractMethod('CONTRACT123', 'get_balance', {
        user: 'GADDRESS',
      });

      expect(result).toHaveProperty('contractId', 'CONTRACT123');
      expect(result).toHaveProperty('method', 'get_balance');
      expect(result).toHaveProperty('result', 'success');
      expect(result).toHaveProperty('gasUsed');
    });
  });
});
