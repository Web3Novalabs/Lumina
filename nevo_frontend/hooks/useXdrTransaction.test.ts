import { renderHook, act } from '@testing-library/react';
import { useXdrTransaction } from './useXdrTransaction';

jest.mock('@/lib/stellar', () => ({
  signTransaction: jest.fn(),
}));

import { signTransaction } from '@/lib/stellar';

const mockSignTransaction = signTransaction as jest.Mock;

describe('useXdrTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with idle status and null txHash/error', () => {
      const { result } = renderHook(() => useXdrTransaction());

      expect(result.current.status).toBe('idle');
      expect(result.current.txHash).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('success flow', () => {
    it('transitions idle → signing → submitting → success with a string XDR payload', async () => {
      mockSignTransaction.mockResolvedValue('signed-xdr-string');
      const getXdr = jest.fn().mockResolvedValue('unsigned-xdr-string');
      const submitXdr = jest.fn().mockResolvedValue('tx-hash-abc123');

      const { result } = renderHook(() => useXdrTransaction());

      expect(result.current.status).toBe('idle');

      let hash: unknown;
      await act(async () => {
        hash = await result.current.submit(getXdr, submitXdr);
      });

      // State transitions
      expect(getXdr).toHaveBeenCalledTimes(1);
      expect(mockSignTransaction).toHaveBeenCalledWith('unsigned-xdr-string');
      expect(submitXdr).toHaveBeenCalledWith('signed-xdr-string');

      expect(result.current.status).toBe('success');
      expect(result.current.txHash).toBe('tx-hash-abc123');
      expect(result.current.error).toBeNull();
      expect(hash).toBe('tx-hash-abc123');
    });

    it('handles object XDR payload with unsignedXdr property', async () => {
      mockSignTransaction.mockResolvedValue('signed-xdr-obj');
      const getXdr = jest
        .fn()
        .mockResolvedValue({ unsignedXdr: 'unsigned-xdr-from-object' });
      const submitXdr = jest.fn().mockResolvedValue('tx-hash-def456');

      const { result } = renderHook(() => useXdrTransaction());

      await act(async () => {
        await result.current.submit(getXdr, submitXdr);
      });

      expect(mockSignTransaction).toHaveBeenCalledWith(
        'unsigned-xdr-from-object'
      );
      expect(submitXdr).toHaveBeenCalledWith('signed-xdr-obj');
      expect(result.current.status).toBe('success');
      expect(result.current.txHash).toBe('tx-hash-def456');
    });

    it('extracts txHash from object result with hash property', async () => {
      mockSignTransaction.mockResolvedValue('signed-xdr');
      const getXdr = jest.fn().mockResolvedValue('unsigned-xdr');
      const submitXdr = jest.fn().mockResolvedValue({ hash: 'hash-from-obj' });

      const { result } = renderHook(() => useXdrTransaction());

      await act(async () => {
        await result.current.submit(getXdr, submitXdr);
      });

      expect(result.current.status).toBe('success');
      expect(result.current.txHash).toBe('hash-from-obj');
    });

    it('extracts txHash from object result with txHash property', async () => {
      mockSignTransaction.mockResolvedValue('signed-xdr');
      const getXdr = jest.fn().mockResolvedValue('unsigned-xdr');
      const submitXdr = jest
        .fn()
        .mockResolvedValue({ txHash: 'txhash-from-obj' });

      const { result } = renderHook(() => useXdrTransaction());

      await act(async () => {
        await result.current.submit(getXdr, submitXdr);
      });

      expect(result.current.status).toBe('success');
      expect(result.current.txHash).toBe('txhash-from-obj');
    });
  });

  describe('error flow', () => {
    it('transitions idle → signing → error when getXdr throws', async () => {
      const getXdr = jest
        .fn()
        .mockRejectedValue(new Error('Failed to get XDR'));
      const submitXdr = jest.fn();

      const { result } = renderHook(() => useXdrTransaction());

      await act(async () => {
        try {
          await result.current.submit(getXdr, submitXdr);
        } catch (_) {
          // expected
        }
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Failed to get XDR');
      expect(result.current.txHash).toBeNull();
      expect(submitXdr).not.toHaveBeenCalled();
    });

    it('transitions idle → signing → error when signTransaction throws', async () => {
      mockSignTransaction.mockRejectedValue(new Error('User rejected'));
      const getXdr = jest.fn().mockResolvedValue('unsigned-xdr');
      const submitXdr = jest.fn();

      const { result } = renderHook(() => useXdrTransaction());

      await act(async () => {
        try {
          await result.current.submit(getXdr, submitXdr);
        } catch (_) {
          // expected
        }
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('User rejected');
      expect(result.current.txHash).toBeNull();
      expect(submitXdr).not.toHaveBeenCalled();
    });

    it('transitions idle → signing → submitting → error when submitXdr throws', async () => {
      mockSignTransaction.mockResolvedValue('signed-xdr');
      const getXdr = jest.fn().mockResolvedValue('unsigned-xdr');
      const submitXdr = jest.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useXdrTransaction());

      await act(async () => {
        try {
          await result.current.submit(getXdr, submitXdr);
        } catch (_) {
          // expected
        }
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Network error');
      expect(result.current.txHash).toBeNull();
    });

    it('uses fallback message for non-Error throws', async () => {
      mockSignTransaction.mockRejectedValue('plain string error');
      const getXdr = jest.fn().mockResolvedValue('unsigned-xdr');
      const submitXdr = jest.fn();

      const { result } = renderHook(() => useXdrTransaction());

      await act(async () => {
        try {
          await result.current.submit(getXdr, submitXdr);
        } catch (_) {
          // expected
        }
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Failed to submit transaction');
    });

    it('re-throws the error after setting error state', async () => {
      const error = new Error('Test error');
      mockSignTransaction.mockRejectedValue(error);
      const getXdr = jest.fn().mockResolvedValue('unsigned-xdr');
      const submitXdr = jest.fn();

      const { result } = renderHook(() => useXdrTransaction());

      let caught: unknown;
      await act(async () => {
        try {
          await result.current.submit(getXdr, submitXdr);
        } catch (e) {
          caught = e;
        }
      });

      expect(caught).toBe(error);
      expect(result.current.status).toBe('error');
    });
  });

  describe('state reset', () => {
    it('clears previous error and txHash on a new submit call', async () => {
      // First call: error
      mockSignTransaction.mockRejectedValueOnce(new Error('First error'));
      const getXdr = jest.fn().mockResolvedValue('unsigned-xdr');
      const submitXdr = jest.fn();

      const { result } = renderHook(() => useXdrTransaction());

      await act(async () => {
        try {
          await result.current.submit(getXdr, submitXdr);
        } catch (_) {}
      });

      expect(result.current.error).toBe('First error');

      // Second call: success
      mockSignTransaction.mockResolvedValue('signed-xdr');
      submitXdr.mockResolvedValue('new-tx-hash');

      await act(async () => {
        await result.current.submit(getXdr, submitXdr);
      });

      expect(result.current.status).toBe('success');
      expect(result.current.error).toBeNull();
      expect(result.current.txHash).toBe('new-tx-hash');
    });
  });
});
