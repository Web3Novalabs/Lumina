import { Test, TestingModule } from '@nestjs/testing';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

describe('ContractController', () => {
  let controller: ContractController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractController],
      providers: [
        ContractService,
        {
          provide: APP_INTERCEPTOR,
          useClass: ResponseInterceptor,
        },
      ],
    }).compile();

    controller = module.get<ContractController>(ContractController);
  });

  describe('POST /contract/contribute', () => {
    it('should build contribution transaction with unsignedXdr', () => {
      const dto = {
        poolId: '1',
        donor: 'GADDRESS',
        amount: '100',
        asset: 'XLM' as const,
      };

      const result = controller.buildContribution(dto);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('poolId', '1');
      expect(result.data).toHaveProperty('donor', 'GADDRESS');
      expect(result.data).toHaveProperty('amount', '100');
      expect(result.data).toHaveProperty('status', 'prepared');
      expect(result).toHaveProperty('unsignedXdr');
      expect(result.unsignedXdr).toMatch(/^AAAA/); // XDR starts with AAAA
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('POST /contract/submit', () => {
    it('should submit transaction with txHash', () => {
      const dto = { signedXdr: 'xdr_string' };

      const result = controller.submitTransaction(dto);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('status', 'submitted');
      expect(result.data).toHaveProperty('confirmations', 0);
      expect(result).toHaveProperty('txHash');
      expect(result.txHash).toMatch(/^0x/); // Transaction hash starts with 0x
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('GET /contract/state/:contractId', () => {
    it('should return contract state', () => {
      const result = controller.getContractState('CONTRACT123');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('contractId', 'CONTRACT123');
      expect(result.data).toHaveProperty('totalFunded');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('POST /contract/call', () => {
    it('should call contract method', () => {
      const dto = {
        contractId: 'CONTRACT123',
        method: 'get_balance',
        params: { user: 'GADDRESS' },
      };

      const result = controller.callContractMethod(dto);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('method', 'get_balance');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('timestamp');
    });
  });
});
