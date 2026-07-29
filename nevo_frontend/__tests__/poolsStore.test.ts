import { usePoolsStore, Pool } from '@/src/store/poolsStore';
import { apiClient } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const mockedGet = jest.mocked(apiClient.get);

const pools: Pool[] = [
  {
    id: '1',
    title: 'Alpha Fund',
    description: 'desc a',
    category: 'DeFi',
    status: 'Active',
    target: 1000,
    raised: 500,
    imageColor: '#fff',
  },
  {
    id: '2',
    title: 'Beta Pool',
    description: 'desc b',
    category: 'NFT',
    status: 'Completed',
    target: 2000,
    raised: 2000,
    imageColor: '#000',
  },
];

beforeEach(() =>
  usePoolsStore.setState({
    pools: [],
    filters: { search: '', categories: [], statuses: [] },
    loading: false,
    poolLoading: false,
    currentPool: null,
    error: null,
  })
);

beforeEach(() => {
  mockedGet.mockReset();
});

describe('poolsStore', () => {
  it('sets pools', () => {
    usePoolsStore.getState().setPools(pools);
    expect(usePoolsStore.getState().pools).toHaveLength(2);
  });

  it('filters by search', () => {
    usePoolsStore.getState().setPools(pools);
    usePoolsStore.getState().setSearch('alpha');
    expect(usePoolsStore.getState().filteredPools()).toHaveLength(1);
  });

  it('filters by category', () => {
    usePoolsStore.getState().setPools(pools);
    usePoolsStore.getState().toggleCategory('NFT');
    expect(usePoolsStore.getState().filteredPools()).toHaveLength(1);
    expect(usePoolsStore.getState().filteredPools()[0].id).toBe('2');
  });

  it('filters by status', () => {
    usePoolsStore.getState().setPools(pools);
    usePoolsStore.getState().toggleStatus('Active');
    expect(usePoolsStore.getState().filteredPools()).toHaveLength(1);
  });

  it('clears filters', () => {
    usePoolsStore.getState().setPools(pools);
    usePoolsStore.getState().setSearch('alpha');
    usePoolsStore.getState().clearFilters();
    expect(usePoolsStore.getState().filteredPools()).toHaveLength(2);
  });

  it('toggles category off when already selected', () => {
    usePoolsStore.getState().toggleCategory('DeFi');
    usePoolsStore.getState().toggleCategory('DeFi');
    expect(usePoolsStore.getState().filters.categories).toHaveLength(0);
  });

  describe('fetchPool', () => {
    it('sets currentPool and poolLoading on successful fetch', async () => {
      const poolData: Pool = {
        id: '5',
        title: 'Test Pool',
        description: 'A test pool',
        category: 'Education',
        status: 'Active',
        target: 5000,
        raised: 1000,
        imageColor: '#123456',
        creator:
          'GABCDE1234567890ABCDE1234567890ABCDE1234567890ABCDE1234567890',
        createdAt: '2025-06-01',
      };
      mockedGet.mockResolvedValue(poolData);

      const result = await usePoolsStore.getState().fetchPool(5);

      expect(mockedGet).toHaveBeenCalledWith('/pools/5');
      expect(usePoolsStore.getState().currentPool).toEqual(poolData);
      expect(usePoolsStore.getState().poolLoading).toBe(false);
      expect(result).toEqual(poolData);
    });

    it('sets poolLoading to true while fetching', async () => {
      let resolvePromise!: (value: Pool) => void;
      const pendingPromise = new Promise<Pool>((resolve) => {
        resolvePromise = resolve;
      });
      mockedGet.mockReturnValue(pendingPromise);

      const fetchPromise = usePoolsStore.getState().fetchPool(1);

      expect(usePoolsStore.getState().poolLoading).toBe(true);

      const poolData: Pool = {
        id: '1',
        title: 'Test Pool',
        description: 'desc',
        category: 'Tech',
        status: 'Active',
        target: 1000,
        raised: 0,
        imageColor: '#fff',
      };
      resolvePromise(poolData);
      await fetchPromise;

      expect(usePoolsStore.getState().poolLoading).toBe(false);
    });

    it('sets currentPool to null and returns null on fetch error', async () => {
      // Set a pool first so we can verify it gets cleared
      const existingPool: Pool = {
        id: '99',
        title: 'Existing',
        description: 'Existing pool',
        category: 'Tech',
        status: 'Active',
        target: 1000,
        raised: 0,
        imageColor: '#fff',
      };
      usePoolsStore.setState({ currentPool: existingPool });

      mockedGet.mockRejectedValue(new Error('Not Found'));

      const result = await usePoolsStore.getState().fetchPool(999);

      expect(mockedGet).toHaveBeenCalledWith('/pools/999');
      expect(usePoolsStore.getState().currentPool).toBeNull();
      expect(usePoolsStore.getState().poolLoading).toBe(false);
      expect(usePoolsStore.getState().error).toBe('Not Found');
      expect(result).toBeNull();
    });

    it('sets currentPool to null and returns null on generic network error', async () => {
      usePoolsStore.setState({ currentPool: pools[0] });
      mockedGet.mockRejectedValue(new Error('Network error'));

      const result = await usePoolsStore.getState().fetchPool(1);

      expect(usePoolsStore.getState().currentPool).toBeNull();
      expect(usePoolsStore.getState().poolLoading).toBe(false);
      expect(usePoolsStore.getState().error).toBe('Network error');
      expect(result).toBeNull();
    });
  });
});
