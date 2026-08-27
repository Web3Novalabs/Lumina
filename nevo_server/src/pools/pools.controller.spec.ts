import { Test, TestingModule } from '@nestjs/testing';
import { PoolsController } from './pools.controller';
import { PoolsService } from './pools.service';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

describe('PoolsController', () => {
  let controller: PoolsController;
  let service: PoolsService;

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
    service = module.get<PoolsService>(PoolsService);
  });

  describe('GET /pools', () => {
    it('should return paginated pools', () => {
      const result = controller.findAll(1, 10);

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
    });
  });

  describe('GET /pools/:id', () => {
    it('should return a single pool', () => {
      const pool = controller.findOne(1);

      expect(pool).toBeDefined();
      expect(pool?.id).toBe(1);
    });
  });

  describe('POST /pools', () => {
    it('should create a pool', () => {
      const dto = {
        title: 'New Pool',
        description: 'Test',
        category: 'Healthcare',
        goal: 50000,
      };

      const result = controller.create(dto);

      expect(result).toBeDefined();
      expect(result.title).toBe('New Pool');
    });
  });

  describe('PATCH /pools/:id', () => {
    it('should update a pool', () => {
      const updated = controller.update(1, { title: 'Updated' });

      expect(updated?.title).toBe('Updated');
    });
  });

  describe('DELETE /pools/:id', () => {
    it('should delete a pool', () => {
      const result = controller.remove(1);

      expect(result).toBeDefined();
    });
  });
});
