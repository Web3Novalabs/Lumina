import { Test, TestingModule } from '@nestjs/testing';
import { PoolsService } from './pools.service';

describe('PoolsService', () => {
  let service: PoolsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PoolsService],
    }).compile();

    service = module.get<PoolsService>(PoolsService);
  });

  describe('findAll', () => {
    it('should return all pools with pagination', () => {
      const result = service.findAll(1, 10);

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should handle pagination offset correctly', () => {
      const page1 = service.findAll(1, 1);
      const page2 = service.findAll(2, 1);

      expect(page1.items).toHaveLength(1);
      expect(page2.items).toHaveLength(1);
      expect(page1.items[0]?.id).not.toBe(page2.items[0]?.id);
    });
  });

  describe('findOne', () => {
    it('should return a single pool by id', () => {
      const pool = service.findOne(1);

      expect(pool).toBeDefined();
      expect(pool?.id).toBe(1);
    });

    it('should return undefined for non-existent pool', () => {
      const pool = service.findOne(999);

      expect(pool).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create a new pool', () => {
      const dto = {
        title: 'New Pool',
        description: 'Test pool',
        category: 'Healthcare',
        goal: 50000,
      };

      const pool = service.create(dto);

      expect(pool).toBeDefined();
      expect(pool.title).toBe('New Pool');
      expect(pool.raised).toBe(0);
      expect(pool.contributors).toBe(0);
      expect(pool.trending).toBe(false);
    });
  });

  describe('update', () => {
    it('should update an existing pool', () => {
      const updated = service.update(1, { title: 'Updated Title' });

      expect(updated?.title).toBe('Updated Title');
    });

    it('should return undefined for non-existent pool', () => {
      const result = service.update(999, { title: 'Updated' });

      expect(result).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('should remove a pool', () => {
      const removed = service.remove(1);

      expect(removed).toBeDefined();
      expect(removed?.id).toBe(1);

      const notFound = service.findOne(1);
      expect(notFound).toBeUndefined();
    });

    it('should return null for non-existent pool', () => {
      const result = service.remove(999);

      expect(result).toBeNull();
    });
  });
});
