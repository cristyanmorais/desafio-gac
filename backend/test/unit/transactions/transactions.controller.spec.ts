import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionsController } from 'src/transactions/transactions.controller';
import { TransactionsService } from 'src/transactions/transactions.service';
import { Transaction } from 'src/transactions/transaction.entity';
import { CreateTransactionDto } from 'src/transactions/dto/create-transaction.dto';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let transactionsService: TransactionsService;

  const mockTransaction: Transaction = {
    id: 'transaction-id',
    sender: { id: 'sender-id', name: 'Sender User', balance: 900 } as any,
    receiver: { id: 'receiver-id', name: 'Receiver User', balance: 1100 } as any,
    amount: 100,
    status: 'COMPLETED',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockTransactionsService = {
    transfer: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    transactionsService = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('transfer', () => {
    const createTransactionDto: CreateTransactionDto = {
      senderId: 'sender-id',
      receiverId: 'receiver-id',
      amount: 100,
    };

    it('deve chamar o service e retornar a transação', async () => {
      mockTransactionsService.transfer.mockResolvedValue(mockTransaction);

      const result = await controller.transfer(createTransactionDto);

      expect(transactionsService.transfer).toHaveBeenCalledWith(
        createTransactionDto.senderId,
        createTransactionDto.receiverId,
        createTransactionDto.amount,
      );
      expect(result).toEqual(mockTransaction);
    });

    it('deve lançar BadRequestException se o service lançar', async () => {
      mockTransactionsService.transfer.mockRejectedValue(
        new BadRequestException('Saldo insuficiente'),
      );

      await expect(controller.transfer(createTransactionDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar NotFoundException se o service lançar', async () => {
      mockTransactionsService.transfer.mockRejectedValue(
        new NotFoundException('Usuário não encontrado'),
      );

      await expect(controller.transfer(createTransactionDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
