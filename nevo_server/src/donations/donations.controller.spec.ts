import { Test, TestingModule } from '@nestjs/testing';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';

describe('DonationsController', () => {
  let controller: DonationsController;
  let service: DonationsService;

  const mockDonationsService = {
    findByPool: jest.fn().mockImplementation((poolId: string, sort: string) => Promise.resolve([{ id: 'don-1', poolId, sort }])),
    findByDonor: jest.fn().mockImplementation((donor: string, sort: string) => Promise.resolve([{ id: 'don-1', donor, sort }])),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DonationsController],
      providers: [
        {
          provide: DonationsService,
          useValue: mockDonationsService,
        },
      ],
    }).compile();

    controller = module.get<DonationsController>(DonationsController);
    service = module.get<DonationsService>(DonationsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findByPool (GET pools/:id/donations)', () => {
    it('should call service.findByPool with pool id and default sort ("newest")', async () => {
      const result = await controller.findByPool('pool-123');
      expect(service.findByPool).toHaveBeenCalledWith('pool-123', 'newest');
      expect(result).toEqual([{ id: 'don-1', poolId: 'pool-123', sort: 'newest' }]);
    });

    it('should call service.findByPool with sortBy="largest" when query param passed', async () => {
      const result = await controller.findByPool('pool-123', 'largest');
      expect(service.findByPool).toHaveBeenCalledWith('pool-123', 'largest');
      expect(result).toEqual([{ id: 'don-1', poolId: 'pool-123', sort: 'largest' }]);
    });
  });

  describe('findMyDonations (GET users/me/donations)', () => {
    it('should call service.findByDonor with user publicKey', async () => {
      const req = { user: { publicKey: 'GABC123' } } as any;
      const result = await controller.findMyDonations(req);
      expect(service.findByDonor).toHaveBeenCalledWith('GABC123', 'newest');
      expect(result).toEqual([{ id: 'don-1', donor: 'GABC123', sort: 'newest' }]);
    });
  });
});
