import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { Repository } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import * as StellarSdk from '@stellar/stellar-sdk';

import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';
import { Pool, PoolStatus } from './../src/pools/pool.entity';
import { User } from './../src/users/user.entity';
import { Donation } from './../src/donations/donation.entity';
import { SyncState } from './../src/sync/sync-state.entity';
import { Nonce } from './../src/auth/nonce.entity';
import { GlobalExceptionFilter } from './../src/common/global-exception.filter';
import { LoggingMiddleware } from './../src/common/logging.middleware';

import { AuthModule } from './../src/auth/auth.module';
import { PoolsModule } from './../src/pools/pools.module';
import { DonationsModule } from './../src/donations/donations.module';
import { UsersModule } from './../src/users/users.module';
import { ContractModule } from './../src/contract/contract.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'sqljs',
      entities: [User, Pool, Donation, SyncState, Nonce],
      synchronize: true,
      dropSchema: true,
    }),
    AuthModule,
    PoolsModule,
    DonationsModule,
    UsersModule,
    ContractModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
class TestAppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let poolRepo: Repository<Pool>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    poolRepo = moduleFixture.get<Repository<Pool>>(getRepositoryToken(Pool));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth — challenge/verify flow', () => {
    const keypair = StellarSdk.Keypair.random();
    const publicKey = keypair.publicKey();

    it('GET /auth/challenge returns a nonce for a valid public key', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/challenge')
        .query({ publicKey })
        .expect(200);

      const body = res.body as { nonce: string };
      expect(body).toHaveProperty('nonce');
      expect(typeof body.nonce).toBe('string');
      expect(body.nonce.length).toBeGreaterThan(0);
    });

    it('GET /auth/challenge without publicKey returns 400', async () => {
      await request(app.getHttpServer()).get('/auth/challenge').expect(400);
    });

    it('POST /auth/verify with a valid Stellar signature returns accessToken and user', async () => {
      const challengeRes = await request(app.getHttpServer())
        .get('/auth/challenge')
        .query({ publicKey })
        .expect(200);

      const nonce = (challengeRes.body as { nonce: string }).nonce;
      const signature = keypair.sign(Buffer.from(nonce)).toString('hex');

      const verifyRes = await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ publicKey, signature, message: nonce })
        .expect(201);

      const body = verifyRes.body as {
        accessToken: string;
        user: Record<string, unknown>;
      };
      expect(body).toHaveProperty('accessToken');
      expect(typeof body.accessToken).toBe('string');
      expect(body).toHaveProperty('user');
      expect(body.user).toMatchObject({
        publicKey,
      });
    });

    it('POST /auth/verify with an invalid signature returns 401', async () => {
      const challengeRes = await request(app.getHttpServer())
        .get('/auth/challenge')
        .query({ publicKey })
        .expect(200);

      const nonce = (challengeRes.body as { nonce: string }).nonce;
      const badSignature = '00'.repeat(64);

      await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ publicKey, signature: badSignature, message: nonce })
        .expect(401);
    });

    it('POST /auth/verify with the same nonce twice returns 401 on second call', async () => {
      const challengeRes = await request(app.getHttpServer())
        .get('/auth/challenge')
        .query({ publicKey })
        .expect(200);

      const nonce = (challengeRes.body as { nonce: string }).nonce;
      const signature = keypair.sign(Buffer.from(nonce)).toString('hex');

      await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ publicKey, signature, message: nonce })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ publicKey, signature, message: nonce })
        .expect(401);
    });
  });

  describe('Pools — seeded data', () => {
    beforeEach(async () => {
      await poolRepo.clear();
      await poolRepo.save([
        poolRepo.create({
          contractPoolId: '42',
          creatorWallet: 'GABC1234567890123456789012345678901234567',
          goal: '100000',
          title: 'Community Garden',
          description: 'Building a community garden in the park',
          category: 'Environment',
          status: PoolStatus.Active,
          raised: '25000',
          imageUrl: null,
        }),
        poolRepo.create({
          contractPoolId: '99',
          creatorWallet: 'GDEF9876543210987654321098765432109876543',
          goal: '50000',
          title: 'School Supplies',
          description: 'School supplies for underprivileged children',
          category: 'Education',
          status: PoolStatus.Active,
          raised: '0',
          imageUrl: null,
        }),
        poolRepo.create({
          contractPoolId: '7',
          creatorWallet: 'GXYZ1111111111111111111111111111111111111',
          goal: '200000',
          title: 'Animal Shelter',
          description: 'New roof for the animal shelter',
          category: 'Animals',
          status: PoolStatus.Completed,
          raised: '200000',
          imageUrl: null,
        }),
      ]);
    });

    it('GET /pools returns all seeded pools with pagination', async () => {
      const res = await request(app.getHttpServer()).get('/pools').expect(200);

      const body = res.body as {
        data: unknown[];
        total: number;
        page: number;
        limit: number;
      };
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('page');
      expect(body).toHaveProperty('limit');
      expect(body.total).toBe(3);
      expect(body.data).toHaveLength(3);
    });

    it('GET /pools filters by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/pools')
        .query({ status: 'active' })
        .expect(200);

      const body = res.body as { total: number; data: Pool[] };
      expect(body.total).toBe(2);
      expect(body.data.every((p: Pool) => p.status === PoolStatus.Active)).toBe(
        true,
      );
    });

    it('GET /pools filters by category', async () => {
      const res = await request(app.getHttpServer())
        .get('/pools')
        .query({ category: 'Education' })
        .expect(200);

      const body = res.body as { total: number; data: Pool[] };
      expect(body.total).toBe(1);
      expect(body.data[0].title).toBe('School Supplies');
    });

    it('GET /pools searches by title or description', async () => {
      const res = await request(app.getHttpServer())
        .get('/pools')
        .query({ search: 'garden' })
        .expect(200);

      const body = res.body as { total: number; data: Pool[] };
      expect(body.total).toBe(1);
      expect(body.data[0].title).toBe('Community Garden');
    });

    it('GET /pools/:id returns a single pool', async () => {
      const res = await request(app.getHttpServer())
        .get('/pools/42')
        .expect(200);

      const body = res.body as {
        contractPoolId: string;
        title: string;
        creatorWallet: string;
      };
      expect(body).toMatchObject({
        contractPoolId: '42',
        title: 'Community Garden',
        creatorWallet: 'GABC1234567890123456789012345678901234567',
      });
    });
  });
});
