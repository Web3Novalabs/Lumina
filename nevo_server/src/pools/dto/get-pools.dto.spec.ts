import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ContractService } from '../../contract/contract.service';
import { PoolsController } from '../pools.controller';
import { PoolsService } from '../pools.service';

/**
 * GetPoolsDto's fields only survive the global ValidationPipe because they are
 * decorated. These tests pin that down: without the decorators every filter
 * below is stripped by `whitelist` and then rejected by `forbidNonWhitelisted`.
 */
describe('GetPoolsDto (GET /pools query contract)', () => {
  let app: INestApplication;
  let findAll: jest.Mock;

  beforeEach(async () => {
    findAll = jest
      .fn()
      .mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PoolsController],
      providers: [
        { provide: PoolsService, useValue: { findAll } },
        { provide: ContractService, useValue: {} },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    // Same configuration as main.ts.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('accepts a request with no query parameters', async () => {
    await request(app.getHttpServer()).get('/pools').expect(200);
    expect(findAll).toHaveBeenCalledWith({});
  });

  it('passes every documented filter through to the service', async () => {
    await request(app.getHttpServer())
      .get('/pools')
      .query({
        page: '2',
        limit: '25',
        search: 'clean water',
        category: 'health',
        status: 'Active',
      })
      .expect(200);

    expect(findAll).toHaveBeenCalledWith({
      page: '2',
      limit: '25',
      search: 'clean water',
      category: 'health',
      status: 'Active',
    });
  });

  it('accepts a lowercase status', async () => {
    await request(app.getHttpServer())
      .get('/pools')
      .query({ status: 'completed' })
      .expect(200);
    expect(findAll).toHaveBeenCalledWith({ status: 'completed' });
  });

  it('rejects a non-numeric page with 400', async () => {
    await request(app.getHttpServer())
      .get('/pools')
      .query({ page: 'abc' })
      .expect(400);
    expect(findAll).not.toHaveBeenCalled();
  });

  it('rejects an unknown status with 400', async () => {
    await request(app.getHttpServer())
      .get('/pools')
      .query({ status: 'archived' })
      .expect(400);
    expect(findAll).not.toHaveBeenCalled();
  });

  it('rejects unknown query parameters with 400', async () => {
    await request(app.getHttpServer())
      .get('/pools')
      .query({ sortBy: 'largest' })
      .expect(400);
    expect(findAll).not.toHaveBeenCalled();
  });
});
