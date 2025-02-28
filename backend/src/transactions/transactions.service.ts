import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Transaction } from './transaction.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class TransactionsService {
  // Use the built-in Logger instead of injecting it
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly usersService: UsersService, // UsersService is correctly injected
  ) {}

  async transfer(senderId: string, receiverId: string, amount: number): Promise<Transaction> {
    // Validate input
    if (senderId === receiverId) {
      throw new BadRequestException('Não é possível transferir para si mesmo.');
    }

    if (amount <= 0) {
      throw new BadRequestException('Valor da transferência inválido.');
    }

    // Fetch sender and receiver
    const sender = await this.usersService.findById(senderId);
    const receiver = await this.usersService.findById(receiverId);

    if (!sender) {
      throw new NotFoundException('Usuário remetente não encontrado.');
    }
    if (!receiver) {
      throw new NotFoundException('Usuário destinatário não encontrado.');
    }

    // Check sender's balance
    if (sender.balance < amount) {
      throw new BadRequestException('Saldo insuficiente.');
    }

    // Perform the transaction
    try {
      const transaction = await this.transactionRepository.manager.transaction(async (manager: EntityManager) => {
        // Update balances
        sender.balance = Number(sender.balance) - amount;
        receiver.balance = Number(receiver.balance) + amount;

        // Save updated balances
        await manager.save(sender);
        await manager.save(receiver);

        // Create and save the transaction record
        const createdTransaction = manager.create(Transaction, {
          sender,
          receiver,
          amount,
          status: 'COMPLETED',
        });

        const savedTransaction = await manager.save(createdTransaction);

        // Log the successful transaction
        this.logger.log(`Transferência de ${amount} realizada de ${sender.name} para ${receiver.name}.`);

        return savedTransaction;
      });

      return transaction;
    } catch (error) {
      // Log the error and rethrow
      this.logger.error('Erro ao processar transferência', error.stack);
      throw new InternalServerErrorException('Erro ao processar transferência.');
    }
  }
}