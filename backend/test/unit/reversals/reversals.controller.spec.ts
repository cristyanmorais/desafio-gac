import { Test, TestingModule } from '@nestjs/testing';
import { CreateReversalDto } from 'src/reversals/dto/create-reversal.dto';
import { ReversalRequest } from 'src/reversals/reversal.entity';
import { ReversalsController } from 'src/reversals/reversals.controller';
import { ReversalsService } from 'src/reversals/reversals.service';

describe('ReversalsController', () => {
  let controller: ReversalsController;
  let service: ReversalsService;

  const mockReversalRequest = {
    id: 'reversal-id',
    transaction: { id: 'transaction-id' },
    requester: { id: 'requester-id' },
    status: 'PENDING',
  } as ReversalRequest;

  const mockReversalsService = {
    requestReversal: jest.fn().mockResolvedValue(mockReversalRequest),
    approveReversal: jest.fn().mockResolvedValue({ ...mockReversalRequest, status: 'APPROVED' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReversalsController],
      providers: [
        {
          provide: ReversalsService,
          useValue: mockReversalsService,
        },
      ],
    }).compile();

    controller = module.get<ReversalsController>(ReversalsController);
    service = module.get<ReversalsService>(ReversalsService);
  });

  describe('requestReversal', () => {
    it('deve chamar o service com os parâmetros corretos e retornar o resultado', async () => {
      const dto: CreateReversalDto = {
        transactionId: 'transaction-id',
        requesterId: 'requester-id',
      };

      const result = await controller.requestReversal(dto);

      expect(service.requestReversal).toHaveBeenCalledWith(dto.transactionId, dto.requesterId);
      expect(result).toEqual(mockReversalRequest);
    });
  });

  describe('approveReversal', () => {
    it('deve chamar o service com os parâmetros corretos e retornar o resultado', async () => {
      const id = 'reversal-id';
      const approverId = 'approver-id';

      const result = await controller.approveReversal(id, approverId);

      expect(service.approveReversal).toHaveBeenCalledWith(id, approverId);
      expect(result.status).toBe('APPROVED');
    });
  });
});
