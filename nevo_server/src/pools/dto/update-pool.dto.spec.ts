import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ContractService } from '../../contract/contract.service';
import { PoolsController } from '../pools.controller';
import { PoolsService } from '../pools.service';

/**
 * Pins down the PATCH /pools/:id body contract as it behaves under the global
 * ValidationPipe: how imageUrl is validated and that unknown fields are
 * forbidden.
 */
describe('UpdatePoolDto (PATCH /pools/:id body contract)', () => {
  let app: INestApplication;
  let updateMeta: jest.Mock;

  beforeEach(async () => {
    updateMeta = jest.fn().mockResolvedValue({ id: 'pool-1' });

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PoolsController],
      providers: [
        {
          provide: PoolsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOneMerged: jest.fn(),
            updateMeta,
            findByContractId: jest.fn(),
            buildWithdrawTx: jest.fn(),
            buildClosePoolTx: jest.fn(),
          },
        },
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

  it('accepts a valid imageUrl and reaches the service', async () => {
    await request(app.getHttpServer())
      .patch('/pools/pool-1')
      .send({ imageUrl: 'https://example.com/image.png' })
      .expect(200);

    expect(updateMeta).toHaveBeenCalledWith('pool-1', {
      imageUrl: 'https://example.com/image.png',
    });
  });

  it('rejects a non-URL imageUrl with 400', async () => {
    await request(app.getHttpServer())
      .patch('/pools/pool-1')
      .send({ imageUrl: 'not a url' })
      .expect(400);

    expect(updateMeta).not.toHaveBeenCalled();
  });

  it('accepts a null imageUrl (nullable optional field)', async () => {
    await request(app.getHttpServer())
      .patch('/pools/pool-1')
      .send({ imageUrl: null })
      .expect(200);

    expect(updateMeta).toHaveBeenCalledWith('pool-1', { imageUrl: null });
  });
});
