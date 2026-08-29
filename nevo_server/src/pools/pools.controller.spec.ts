import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PoolsController } from './pools.controller';
import { PoolsService } from './pools.service';

describe('PoolsController', () => {
  let app: INestApplication;
  const poolsService = {
    findAll: jest.fn().mockResolvedValue([]),
    findOneMerged: jest.fn(),
    create: jest.fn(),
    updateMeta: jest.fn(),
    findByContractId: jest.fn(),
    buildWithdrawTx: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PoolsController],
      providers: [{ provide: PoolsService, useValue: poolsService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('rejects a search query longer than 200 characters', async () => {
    const search = 'a'.repeat(201);

    await request(app.getHttpServer())
      .get('/pools')
      .query({ search })
      .expect(400);

    expect(poolsService.findAll).not.toHaveBeenCalled();
  });

  it('rejects a contractPoolId longer than 255 characters on POST /pools', async () => {
    await request(app.getHttpServer())
      .post('/pools')
      .send({
        contractPoolId: 'a'.repeat(256),
        creatorWallet: 'GTEST123',
        goal: '100',
      })
      .expect(400);

    expect(poolsService.create).not.toHaveBeenCalled();
  });
});
