import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ContractService } from '../../contract/contract.service';
import { PoolsController } from '../pools.controller';
import { PoolsService } from '../pools.service';

/**
 * Pins down PATCH /pools/:id body validation under the global ValidationPipe:
 * omitted description/category remain valid, but empty strings are rejected.
 */
describe('UpdatePoolDto (PATCH /pools/:id body contract)', () => {
  let app: INestApplication;
  let updateMeta: jest.Mock;

  beforeEach(async () => {
    updateMeta = jest.fn().mockImplementation((id: string, dto: object) =>
      Promise.resolve({ contractPoolId: id, ...dto }),
    );

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PoolsController],
      providers: [
        { provide: PoolsService, useValue: { updateMeta } },
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

  it('rejects an empty description with 400', async () => {
    await request(app.getHttpServer())
      .patch('/pools/1')
      .send({ description: '' })
      .expect(400);
    expect(updateMeta).not.toHaveBeenCalled();
  });

  it('rejects an empty category with 400', async () => {
    await request(app.getHttpServer())
      .patch('/pools/1')
      .send({ category: '' })
      .expect(400);
    expect(updateMeta).not.toHaveBeenCalled();
  });

  it('accepts a request that omits description and category', async () => {
    await request(app.getHttpServer())
      .patch('/pools/1')
      .send({ imageUrl: 'https://example.com/img.png' })
      .expect(200);

    expect(updateMeta).toHaveBeenCalledWith('1', {
      imageUrl: 'https://example.com/img.png',
    });
  });

  it('accepts a non-empty description update', async () => {
    await request(app.getHttpServer())
      .patch('/pools/1')
      .send({ description: 'Updated description' })
      .expect(200);

    expect(updateMeta).toHaveBeenCalledWith('1', {
      description: 'Updated description',
    });
  });
});
