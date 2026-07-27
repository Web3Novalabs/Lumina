/**
 * Test file for pools API utilities
 * This would typically use a testing framework like Jest
 */

import { archivePool, archiveMultiplePools, fetchUserPools } from '../pools';

// Mock fetch for testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Pools API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('archivePool', () => {
    it('should successfully archive a pool', async () => {
      const mockResponse = {
        success: true,
        poolId: '1',
        status: 'archived',
        message: 'Pool 1 has been successfully archived',
        archivedAt: '2024-01-15T10:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await archivePool('1');

      expect(mockFetch).toHaveBeenCalledWith('/api/pools/1/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when archive fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Pool not found' }),
      });

      await expect(archivePool('999')).rejects.toThrow('Pool not found');
    });
  });

  describe('archiveMultiplePools', () => {
    it('should archive multiple pools successfully', async () => {
      const mockResponses = [
        {
          success: true,
          poolId: '1',
          status: 'archived',
          message: 'Pool 1 has been successfully archived',
          archivedAt: '2024-01-15T10:00:00.000Z'
        },
        {
          success: true,
          poolId: '2',
          status: 'archived',
          message: 'Pool 2 has been successfully archived',
          archivedAt: '2024-01-15T10:00:00.000Z'
        }
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses[0],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses[1],
        });

      const result = await archiveMultiplePools(['1', '2']);

      expect(result).toEqual(mockResponses);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchUserPools', () => {
    it('should return mock pools data', async () => {
      const pools = await fetchUserPools();

      expect(pools).toHaveLength(3);
      expect(pools[0]).toHaveProperty('id');
      expect(pools[0]).toHaveProperty('title');
      expect(pools[0]).toHaveProperty('status');
    });
  });
});