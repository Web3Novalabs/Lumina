import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { ContractService } from '../contract/contract.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let contractService: ContractService;

  const mockContractService = {
    submitSignedXdr: jest.fn().mockResolvedValue('tx-hash-12345'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: ContractService,
          useValue: mockContractService,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    contractService = module.get<ContractService>(ContractService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('submit (POST transactions/submit)', () => {
    it('should submit XDR via ContractService and return txHash', async () => {
      const result = await controller.submit({ xdr: 'AAAA...signedXdr' });
      expect(contractService.submitSignedXdr).toHaveBeenCalledWith('AAAA...signedXdr');
      expect(result).toEqual({ txHash: 'tx-hash-12345' });
    });
  });
});
