import { Injectable } from '@nestjs/common';

/**
 * Mock pool data for development
 */
const MOCK_POOLS = [
  {
    id: 1,
    title: 'Rural Clinic Expansion Fund',
    description: 'Healthcare initiative for rural areas',
    category: 'Healthcare',
    raised: 50000,
    goal: 100000,
    contributors: 234,
    daysLeft: 45,
    yieldRate: 3.5,
    image: 'https://via.placeholder.com/400x300',
    creator: 'GBPG6VYGQ7H7QMVKCJGTPQP5NKQGHQ6K4YGFKQ2DCVK5CJV5RLL5XZTZ',
    trending: true,
  },
  {
    id: 2,
    title: 'Reforestation Initiative',
    description: 'Plant 1 million trees in the Amazon',
    category: 'Environment',
    raised: 75000,
    goal: 150000,
    contributors: 512,
    daysLeft: 30,
    yieldRate: 2.8,
    image: 'https://via.placeholder.com/400x300',
    creator: 'GDWVWPWGWVX5F4KR7QMVKCJGTPQP5NKQGHQ6K4YGFKQ2DCVK5CJV5RLL5',
    trending: true,
  },
];

@Injectable()
export class PoolsService {
  /**
   * Get all pools with optional pagination
   */
  findAll(page = 1, limit = 10) {
    const start = (page - 1) * limit;
    const items = MOCK_POOLS.slice(start, start + limit);

    return {
      items,
      total: MOCK_POOLS.length,
      page,
      limit,
    };
  }

  /**
   * Get a single pool by ID
   */
  findOne(id: number) {
    return MOCK_POOLS.find((pool) => pool.id === id);
  }

  /**
   * Create a new pool
   */
  create(createPoolDto: any) {
    const newPool = {
      id: MOCK_POOLS.length + 1,
      ...createPoolDto,
      raised: 0,
      contributors: 0,
      trending: false,
    };
    MOCK_POOLS.push(newPool);
    return newPool;
  }

  /**
   * Update a pool
   */
  update(id: number, updatePoolDto: any) {
    const pool = this.findOne(id);
    if (pool) {
      Object.assign(pool, updatePoolDto);
    }
    return pool;
  }

  /**
   * Delete a pool
   */
  remove(id: number) {
    const index = MOCK_POOLS.findIndex((pool) => pool.id === id);
    if (index > -1) {
      const [removed] = MOCK_POOLS.splice(index, 1);
      return removed;
    }
    return null;
  }
}
