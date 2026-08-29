import { Test, TestingModule } from '@nestjs/testing';
import { PoolsController } from './pools.controller';
import { PoolsService } from './pools.service';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

describe('PoolsController', () => {
  let controller: PoolsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PoolsController],
      providers: [
        PoolsService,
        {
          provide: APP_INTERCEPTOR,
          useClass: ResponseInterceptor,
        },
      ],
    }).compile();

    controller = module.get<PoolsController>(PoolsController);
  });

  describe('GET /pools', () => {
    it('should return paginated pools with correct structure', () => {
      const result = controller.findAll(1, 10);

      // Service returns pagination format that interceptor will detect and wrap
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
      expect(Array.isArray(result.items)).toBe(true);
    });
  });

  describe('GET /pools/:id', () => {
    it('should return a single pool', () => {
      const pool = controller.findOne(1);

      expect(pool).toBeDefined();
      expect(pool?.id).toBe(1);
      expect(pool?.title).toBeDefined();
      expect(pool?.description).toBeDefined();
    });

    it('should return undefined for non-existent pool', () => {
      const pool = controller.findOne(9999);
      expect(pool).toBeUndefined();
    });
  });

  describe('POST /pools', () => {
    it('should create a pool', () => {
      const dto = {
        title: 'New Pool',
        description: 'Test',
        category: 'Healthcare',
        goal: 50000,
        yieldRate: 2.5,
      };

      const result = controller.create(dto);

      expect(result).toBeDefined();
      expect(result.title).toBe('New Pool');
      expect(result.description).toBe('Test');
      expect(result.raised).toBe(0);
      expect(result.contributors).toBe(0);
      expect(result.trending).toBe(false);
    });
  });

  describe('PATCH /pools/:id', () => {
    it('should update a pool', () => {
      const updated = controller.update(1, { title: 'Updated Title' });

      expect(updated?.title).toBe('Updated Title');
      expect(updated?.id).toBe(1);
    });

    it('should return undefined for non-existent pool', () => {
      const result = controller.update(9999, { title: 'Updated' });
      expect(result).toBeUndefined();
    });
  });

  describe('DELETE /pools/:id', () => {
    it('should delete a pool', () => {
      const result = controller.remove(1);

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
    });

    it('should return null for non-existent pool', () => {
      const result = controller.remove(9999);
      expect(result).toBeNull();
    });
  });
});
