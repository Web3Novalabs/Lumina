import { Test, TestingModule } from '@nestjs/testing';
import { UseGuards } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StellarError } from './stellar.error';

describe('ContractController', () => {
  let controller: ContractController;
  let contractService: { submitSignedXdr: jest.Mock };

  beforeEach(async () => {
    contractService = {
      submitSignedXdr: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractController],
      providers: [
        {
          provide: ContractService,
          useValue: contractService,
        },
      ],
    }).compile();

    controller = module.get<ContractController>(ContractController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('submitXdr (POST /contract/submit)', () => {
    it('forwards the xdr argument to ContractService.submitSignedXdr and returns txHash', async () => {
      const signedXdr = 'AAAA...valid-signed-xdr';
      contractService.submitSignedXdr.mockResolvedValue('tx-hash-abc123');

      const result = await controller.submitXdr({ xdr: signedXdr });

      expect(contractService.submitSignedXdr).toHaveBeenCalledTimes(1);
      expect(contractService.submitSignedXdr).toHaveBeenCalledWith(signedXdr);
      expect(result).toEqual({ txHash: 'tx-hash-abc123' });
    });

    it('propagates StellarError thrown by ContractService without swallowing it', async () => {
      const error = new StellarError('tx_bad_auth');
      contractService.submitSignedXdr.mockRejectedValue(error);

      await expect(
        controller.submitXdr({ xdr: 'bad-xdr' }),
      ).rejects.toThrow(StellarError);

      expect(contractService.submitSignedXdr).toHaveBeenCalledWith('bad-xdr');
    });

    it('propagates generic errors thrown by ContractService', async () => {
      const error = new Error('network timeout');
      contractService.submitSignedXdr.mockRejectedValue(error);

      await expect(
        controller.submitXdr({ xdr: 'some-xdr' }),
      ).rejects.toThrow('network timeout');
    });
  });

  describe('JwtAuthGuard protection', () => {
    it('applies JwtAuthGuard to the submitXdr route handler', () => {
      // Verify the guard decorator is present on the submitXdr method via metadata
      const guards: unknown[] = Reflect.getMetadata(
        '__guards__',
        controller.submitXdr,
      ) ?? [];
      const guardTypes = guards.map((g) =>
        typeof g === 'function' ? g : (g as { constructor: unknown }).constructor,
      );
      expect(guardTypes).toContain(JwtAuthGuard);
    });

    it('applies JwtAuthGuard at the method level of submitXdr', () => {
      const reflector = new Reflector();
      // The guard is registered as a NestJS metadata entry on the method
      const metadata = Reflect.getMetadata(
        '__guards__',
        ContractController.prototype.submitXdr,
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
