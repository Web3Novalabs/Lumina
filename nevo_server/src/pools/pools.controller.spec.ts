import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PoolsController } from './pools.controller';
import { PoolsService } from './pools.service';
import { JwtService } from '@nestjs/jwt';
import { DonationsService } from '../donations/donations.service';
import { ContractService } from '../contract/contract.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { FilterPoolsDto } from './dto/filter-pools.dto';

describe('PoolsController', () => {
  let controller: PoolsController;
  let service: PoolsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PoolsController],
      providers: [
        {
          provide: PoolsService,
          useValue: {
            findAll: jest.fn().mockImplementation((query: FilterPoolsDto) =>
              Promise.resolve({
                data: [],
                total: 0,
                page: query.page ?? 1,
                limit: query.limit ?? 20,
              }),
            ),
          },
        },
        {
          provide: ContractService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<PoolsController>(PoolsController);
    service = module.get<PoolsService>(PoolsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.findAll with query parameters', async () => {
    const query: FilterPoolsDto = { page: 2, limit: 5, search: 'Water' };
    const spy = jest.spyOn(service, 'findAll');

    const result = await controller.findAll(query);

    expect(spy).toHaveBeenCalledWith(query);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(5);
  });
});

describe('PoolsController (withdraw auth)', () => {
  let app: INestApplication;
  let poolsService: {
    findByContractId: jest.Mock;
    buildWithdrawTx: jest.Mock;
  };
  const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret';
  const signToken = (sub: string) =>
    new JwtService({ secret: jwtSecret }).sign({ sub });

  beforeEach(async () => {
    poolsService = {
      findByContractId: jest.fn(),
      buildWithdrawTx: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PoolsController],
      providers: [
        { provide: PoolsService, useValue: poolsService },
        { provide: DonationsService, useValue: {} },
        { provide: ContractService, useValue: {} },
        { provide: JwtService, useValue: {} },
        JwtStrategy,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects an unauthenticated withdraw request', async () => {
    await request(app.getHttpServer())
      .post('/pools/1/withdraw')
      .expect(401);

    expect(poolsService.findByContractId).not.toHaveBeenCalled();
  });

  it('derives the requester wallet from the JWT instead of the body', async () => {
    poolsService.findByContractId.mockResolvedValue({
      contractPoolId: '1',
      creatorWallet: 'GCREATOR',
    });
    poolsService.buildWithdrawTx.mockReturnValue({
      unsignedXdr: 'xdr',
      poolId: '1',
    });
    const token = signToken('GCREATOR');

    await request(app.getHttpServer())
      .post('/pools/1/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .send({ requesterWallet: 'GATTACKER' })
      .expect(201);

    expect(poolsService.buildWithdrawTx).toHaveBeenCalled();
  });

  it('forbids withdrawal when the JWT wallet is not the pool creator', async () => {
    poolsService.findByContractId.mockResolvedValue({
      contractPoolId: '1',
      creatorWallet: 'GCREATOR',
    });
    const token = signToken('GATTACKER');

    await request(app.getHttpServer())
      .post('/pools/1/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(poolsService.buildWithdrawTx).not.toHaveBeenCalled();
  });
});
