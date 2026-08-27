import { Test, TestingModule } from '@nestjs/testing';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

describe('ContractController', () => {
  let controller: ContractController;
  let service: ContractService;

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
    service = module.get<ContractService>(ContractService);
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
      expect(result).toHaveProperty('unsignedXdr');
    });
  });

  describe('POST /contract/submit', () => {
    it('should submit transaction with txHash', () => {
      const dto = { signedXdr: 'xdr_string' };

      const result = controller.submitTransaction(dto);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('txHash');
    });
  });

  describe('GET /contract/state/:contractId', () => {
    it('should return contract state', () => {
      const result = controller.getContractState('CONTRACT123');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('contractId');
      expect(result).toHaveProperty('totalFunded');
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
      expect(result).toHaveProperty('method', 'get_balance');
    });
  });
});
