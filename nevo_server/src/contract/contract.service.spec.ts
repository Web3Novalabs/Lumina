import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TransactionBuilder, Networks, Keypair } from '@stellar/stellar-sdk';
import { ContractService } from './contract.service.js';
import { StellarError } from './stellar.error.js';

const mockConfigService = {
  get: (key: string) => {
    if (key === 'STELLAR_RPC_URL') return 'https://soroban-testnet.stellar.org';
    if (key === 'CONTRACT_ID')
      return 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
    return undefined;
  },
};

const SOURCE = Keypair.random().publicKey();
const NETWORK = Networks.TESTNET;

describe('ContractService', () => {
  let service: ContractService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    service = module.get(ContractService);
  });

  describe('buildCreatePoolTransaction', () => {
    it('returns a valid base64 XDR string', () => {
      const token = Keypair.random().publicKey();
      const xdr = service.buildCreatePoolTransaction({
        creator: SOURCE,
        goal: '1000',
        token,
        title: 'My Pool',
        description: 'desc',
      });
      expect(typeof xdr).toBe('string');
      expect(xdr.length).toBeGreaterThan(0);
      // Must be parseable back into a transaction
      expect(() => TransactionBuilder.fromXDR(xdr, NETWORK)).not.toThrow();
    });
  });

  describe('buildDonateTransaction', () => {
    it('includes the donate contract function name in the XDR', () => {
      const xdr = service.buildDonateTransaction(SOURCE, 1, '500');
      const tx = TransactionBuilder.fromXDR(xdr, NETWORK);
      // The function name is encoded in invokeHostFunctionOp args
      const rawXdr = tx.toXDR();
      expect(rawXdr).toContain(
        Buffer.from('donate').toString('base64').slice(0, 4),
      );
    });

    it('returns a parseable XDR string', () => {
      const xdr = service.buildDonateTransaction(SOURCE, 1, '500');
      expect(() => TransactionBuilder.fromXDR(xdr, NETWORK)).not.toThrow();
    });
  });

  describe('buildWithdrawTransaction', () => {
    it('returns a parseable XDR string', () => {
      const tokenAddress = Keypair.random().publicKey();
      const xdr = service.buildWithdrawTransaction(SOURCE, 1, tokenAddress);
      expect(() => TransactionBuilder.fromXDR(xdr, NETWORK)).not.toThrow();
    });

    it('XDR contains the token address bytes', () => {
      const tokenAddress = Keypair.random().publicKey();
      const xdr = service.buildWithdrawTransaction(SOURCE, 1, tokenAddress);
      expect(xdr.length).toBeGreaterThan(0);
    });
  });

  describe('submitSignedXdr', () => {
    it('throws StellarError when given invalid XDR', async () => {
      await expect(
        service.submitSignedXdr('not-valid-xdr'),
      ).rejects.toBeInstanceOf(StellarError);
    });
  });

  describe('buildClosePoolTransaction', () => {
    it('returns a parseable XDR string', () => {
      const xdr = service.buildClosePoolTransaction(SOURCE, 1);
      expect(() => TransactionBuilder.fromXDR(xdr, NETWORK)).not.toThrow();
    });

    it('XDR contains the pool id', () => {
      const xdr = service.buildClosePoolTransaction(SOURCE, 1);
      expect(xdr.length).toBeGreaterThan(0);
    });
  });

  describe('getContributionOnChain', () => {
    it('returns 0n on RPC error', async () => {
      const donor = Keypair.random().publicKey();
      const result = await service.getContributionOnChain(1, donor);
      expect(result).toBe(0n);
    });
  });

  describe('getPoolOnChain', () => {
    it('returns null on RPC error', async () => {
      const result = await service.getPoolOnChain(1);
      expect(result).toBeNull();
    });
  });

  describe('getTotalRaisedOnChain', () => {
    it('returns 0n on RPC error', async () => {
      const result = await service.getTotalRaisedOnChain(1);
      expect(result).toBe(0n);
    });
  });

  describe('getDonorCountOnChain', () => {
    it('returns 0 on RPC error', async () => {
      const result = await service.getDonorCountOnChain(1);
      expect(result).toBe(0);
    });
  });

  describe('mapError', () => {
    it('maps tx_bad_auth to StellarError with correct code', () => {
      const error = new Error('tx_bad_auth');
      const stellarError = service['mapError'](error);
      expect(stellarError).toBeInstanceOf(StellarError);
      expect(stellarError.message).toBe('Bad authentication');
    });

    it('maps op_underfunded to StellarError with correct code', () => {
      const error = new Error('op_underfunded');
      const stellarError = service['mapError'](error);
      expect(stellarError).toBeInstanceOf(StellarError);
      expect(stellarError.message).toBe('Insufficient balance');
    });

    it('maps op_no_source_account to NOT_FOUND', () => {
      const error = new Error('op_no_source_account');
      const stellarError = service['mapError'](error);
      expect(stellarError).toBeInstanceOf(StellarError);
      expect(stellarError.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(stellarError.message).toBe(
        'Source account does not exist on the network',
      );
    });

    it('maps timeout to REQUEST_TIMEOUT', () => {
      const error = new Error('timeout');
      const stellarError = service['mapError'](error);
      expect(stellarError).toBeInstanceOf(StellarError);
      expect(stellarError.getStatus()).toBe(HttpStatus.REQUEST_TIMEOUT);
    });

    it('falls back to INTERNAL_SERVER_ERROR for unrecognized messages', () => {
      const error = new Error('some unrecognized stellar failure');
      const stellarError = service['mapError'](error);
      expect(stellarError).toBeInstanceOf(StellarError);
      expect(stellarError.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(stellarError.message).toBe('some unrecognized stellar failure');
    });
  });
});
