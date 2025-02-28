import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { TransactionsService } from 'src/transactions/transactions.service';
import { Transaction } from 'src/transactions/transaction.entity';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/user.entity';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionRepository: Repository<Transaction>;
  let usersService: UsersService;

  const mockSender: User = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    password_hash: 'hashedpassword',
    balance: 1000,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockReceiver: User = {
    id: '2',
    name: 'Jane Doe',
    email: 'jane@example.com',
    password_hash: 'hashedpassword',
    balance: 500,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockTransaction: Transaction = {
    id: '1',
    sender: mockSender,
    receiver: mockReceiver,
    amount: 200,
    status: 'COMPLETED',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            manager: {
              transaction: jest.fn().mockImplementation(async (callback) => {
                const mockEntityManager = {
                  save: jest.fn().mockImplementation((entity) => {
                    if (entity instanceof Transaction) {
                      return Promise.resolve(mockTransaction);
                    }
                    return Promise.resolve(entity);
                  }),
                  create: jest.fn().mockReturnValue(mockTransaction),
                } as unknown as EntityManager;

                return callback(mockEntityManager);
              }),
            },
            create: jest.fn().mockReturnValue(mockTransaction),
            save: jest.fn().mockResolvedValue(mockTransaction),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    transactionRepository = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    usersService = module.get<UsersService>(UsersService);
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('transfer', () => {
    it('deve realizar uma transferência com sucesso', async () => {
      jest.spyOn(usersService, 'findById')
        .mockResolvedValueOnce(mockSender)
        .mockResolvedValueOnce(mockReceiver);

      const result = await service.transfer(mockSender.id, mockReceiver.id, 200);

      expect(usersService.findById).toHaveBeenCalledWith(mockSender.id);
      expect(usersService.findById).toHaveBeenCalledWith(mockReceiver.id);
      expect(transactionRepository.manager.transaction).toHaveBeenCalled();
      expect(result).toEqual(mockTransaction);
    });

    it('deve lançar BadRequestException se o remetente e o destinatário forem iguais', async () => {
      await expect(service.transfer('1', '1', 200)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se o valor da transferência for inválido', async () => {
      await expect(service.transfer('1', '2', 0)).rejects.toThrow(BadRequestException);
      await expect(service.transfer('1', '2', -100)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar NotFoundException se o remetente não for encontrado', async () => {
      jest.spyOn(usersService, 'findById').mockRejectedValue(new NotFoundException('Usuário não encontrado.'));

      await expect(service.transfer('1', '2', 200)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se o destinatário não for encontrado', async () => {
      jest.spyOn(usersService, 'findById')
        .mockResolvedValueOnce(mockSender)
        .mockRejectedValue(new NotFoundException('Usuário não encontrado.'));

      await expect(service.transfer('1', '2', 200)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se o saldo do remetente for insuficiente', async () => {
      jest.spyOn(usersService, 'findById')
        .mockResolvedValueOnce(mockSender)
        .mockResolvedValueOnce(mockReceiver);

      await expect(service.transfer('1', '2', 2000)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar InternalServerErrorException se ocorrer um erro durante a transferência', async () => {
      jest.spyOn(usersService, 'findById')
        .mockResolvedValueOnce(mockSender)
        .mockResolvedValueOnce(mockReceiver);

      jest.spyOn(transactionRepository.manager, 'transaction').mockRejectedValue(new Error('Erro no banco de dados'));

      await expect(service.transfer('1', '2', 200)).rejects.toThrow(InternalServerErrorException);
    });
  });
});