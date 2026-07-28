import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { TransactionsController } from './transactions.controller';
import { ContractService } from '../contract/contract.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StellarError } from '../contract/stellar.error';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let contractService: { submitSignedXdr: jest.Mock };

  beforeEach(async () => {
    contractService = {
      submitSignedXdr: jest.fn().mockResolvedValue('tx-hash-12345'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: ContractService,
          useValue: contractService,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('submit (POST /transactions/submit)', () => {
    it('submits signed XDR via ContractService and returns txHash', async () => {
      contractService.submitSignedXdr.mockResolvedValue('tx-hash-12345');

      const result = await controller.submit({ xdr: 'AAAA...signedXdr' });

      expect(contractService.submitSignedXdr).toHaveBeenCalledWith(
        'AAAA...signedXdr',
      );
      expect(result).toEqual({ txHash: 'tx-hash-12345' });
    });

    it('forwards the exact xdr string to ContractService.submitSignedXdr', async () => {
      const signedXdr = 'BBBB...differentXdr';
      contractService.submitSignedXdr.mockResolvedValue('different-hash');

      const result = await controller.submit({ xdr: signedXdr });

      expect(contractService.submitSignedXdr).toHaveBeenCalledTimes(1);
      expect(contractService.submitSignedXdr).toHaveBeenCalledWith(signedXdr);
      expect(result).toEqual({ txHash: 'different-hash' });
    });

    it('propagates StellarError thrown by ContractService (tx_bad_auth)', async () => {
      const error = new StellarError('tx_bad_auth');
      contractService.submitSignedXdr.mockRejectedValue(error);

      await expect(controller.submit({ xdr: 'bad-xdr' })).rejects.toThrow(
        StellarError,
      );
    });

    it('propagates StellarError thrown by ContractService (op_underfunded)', async () => {
      const error = new StellarError('op_underfunded');
      contractService.submitSignedXdr.mockRejectedValue(error);

      await expect(controller.submit({ xdr: 'another-xdr' })).rejects.toThrow(
        StellarError,
      );
    });

    it('propagates generic errors thrown by ContractService without suppression', async () => {
      const error = new Error('RPC connection refused');
      contractService.submitSignedXdr.mockRejectedValue(error);

      await expect(
        controller.submit({ xdr: 'any-xdr' }),
      ).rejects.toThrow('RPC connection refused');
    });

    it('does not call submitSignedXdr more than once per request', async () => {
      contractService.submitSignedXdr.mockResolvedValue('single-call-hash');

      await controller.submit({ xdr: 'once-only' });

      expect(contractService.submitSignedXdr).toHaveBeenCalledTimes(1);
    });
  });

  describe('JwtAuthGuard protection on submit route', () => {
    it('applies JwtAuthGuard to the submit method', () => {
      const metadata = Reflect.getMetadata(
        '__guards__',
        TransactionsController.prototype.submit,
      );
      expect(metadata).toBeDefined();
      expect(Array.isArray(metadata)).toBe(true);
      const hasJwtGuard = (metadata as unknown[]).some(
        (guard) => guard === JwtAuthGuard,
      );
      expect(hasJwtGuard).toBe(true);
    });
  });
});
