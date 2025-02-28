import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReversalsService } from 'src/reversals/reversals.service';
import { ReversalRequest } from 'src/reversals/reversal.entity';
import { Transaction } from 'src/transactions/transaction.entity';
import { UsersService } from 'src/users/users.service';

describe('ReversalsService', () => {
  let service: ReversalsService;
  let reversalRepository: Repository<ReversalRequest>;
  let transactionRepository: Repository<Transaction>;
  let usersService: UsersService;

  const mockReversalRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTransactionRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
    updateBalance: jest.fn(),
  };

  const mockTransaction = {
    id: 'transaction-id',
    sender: { id: 'sender-id', balance: 500 } as any,
    receiver: { id: 'receiver-id', balance: 1500 } as any,
    amount: 100,
    status: 'COMPLETED',
  } as Transaction;

  const mockRequester = { id: 'sender-id' };

  const mockReversal = {
    id: 'reversal-id',
    transaction: mockTransaction,
    requester: mockRequester,
    status: 'PENDING',
  } as ReversalRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReversalsService,
        {
          provide: getRepositoryToken(ReversalRequest),
          useValue: mockReversalRepository,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<ReversalsService>(ReversalsService);
    reversalRepository = module.get<Repository<ReversalRequest>>(getRepositoryToken(ReversalRequest));
    transactionRepository = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    usersService = module.get<UsersService>(UsersService);
  });

  describe('requestReversal', () => {
    it('deve criar e salvar uma reversão válida', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
      mockUsersService.findById.mockResolvedValue(mockRequester);
      mockReversalRepository.create.mockReturnValue(mockReversal);
      mockReversalRepository.save.mockResolvedValue(mockReversal);

      const result = await service.requestReversal('transaction-id', 'sender-id');

      expect(transactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'transaction-id' },
        relations: ['sender', 'receiver'],
      });

      expect(usersService.findById).toHaveBeenCalledWith('sender-id');
      expect(reversalRepository.create).toHaveBeenCalledWith({
        transaction: mockTransaction,
        requester: mockRequester,
      });

      expect(reversalRepository.save).toHaveBeenCalledWith(mockReversal);
      expect(result).toEqual(mockReversal);
    });

    it('deve lançar NotFoundException se a transação não existir', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(service.requestReversal('invalid-id', 'sender-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar NotFoundException se o usuário não existir', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.requestReversal('transaction-id', 'invalid-user-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException se a transação já foi revertida', async () => {
      mockTransaction.status = 'REVERSED';
      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
      mockUsersService.findById.mockResolvedValue(mockRequester);

      await expect(service.requestReversal('transaction-id', 'sender-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException se o usuário não for o sender nem o receiver', async () => {
      const anotherUser = { id: 'unrelated-user' };
      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
      mockUsersService.findById.mockResolvedValue(anotherUser);

      await expect(service.requestReversal('transaction-id', 'unrelated-user')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('approveReversal', () => {
    it('deve aprovar a reversão e processar reversão', async () => {
      mockReversalRepository.findOne.mockResolvedValue({
        ...mockReversal,
        status: 'PENDING',
        transaction: mockTransaction,
        approver: null,
      });

      mockUsersService.findById.mockResolvedValueOnce(mockTransaction.sender);
      mockUsersService.findById.mockResolvedValueOnce(mockTransaction.receiver);

      const result = await service.approveReversal('reversal-id', 'receiver-id');

      expect(reversalRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'reversal-id' },
        relations: ['transaction', 'approver', 'transaction.receiver', 'transaction.sender'],
      });

      expect(reversalRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'APPROVED' }),
      );

      expect(transactionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'REVERSED' }),
      );

      expect(usersService.updateBalance).toHaveBeenCalledWith('sender-id', 600);
      expect(usersService.updateBalance).toHaveBeenCalledWith('receiver-id', 1400);

      expect(result.status).toBe('APPROVED');
    });

    it('deve lançar NotFoundException se o pedido de reversão não existir', async () => {
      mockReversalRepository.findOne.mockResolvedValue(null);

      await expect(service.approveReversal('invalid-id', 'receiver-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException se quem aprova não for o receiver', async () => {
      mockReversalRepository.findOne.mockResolvedValue(mockReversal);

      await expect(service.approveReversal('reversal-id', 'wrong-user-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});