import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Transaction } from './transaction.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly usersService: UsersService,
  ) {}

  async transfer(senderId: string, receiverId: string, amount: number): Promise<Transaction> {
    if (senderId === receiverId) {
      throw new BadRequestException('Não é possível transferir para si mesmo.');
    }
  
    const sender = await this.usersService.findById(senderId);
    const receiver = await this.usersService.findById(receiverId);
  
    if (!sender) {
      throw new NotFoundException('Usuário remetente não encontrado.');
    }
    if (!receiver) {
      throw new NotFoundException('Usuário destinatário não encontrado.');
    }
  
    if (sender.balance < amount) {
      throw new BadRequestException('Saldo insuficiente.');
    }
  
    try {
      const transaction = await this.transactionRepository.manager.transaction(async (manager: EntityManager) => {
        sender.balance = Number(sender.balance) - amount;
        receiver.balance = Number(receiver.balance) + amount;
  
        await manager.save(sender);
        await manager.save(receiver);
  
        const createdTransaction = manager.create(Transaction, {
          sender,
          receiver,
          amount,
          status: 'COMPLETED',
        });

        return await manager.save(createdTransaction);
      });
      
      this.logger.log(`Transferência de ${amount} realizada de ${sender.name} para ${receiver.name}.`);
      return transaction;
    } catch (error) {
      this.logger.error('Erro ao processar transferência', error.stack);
      throw new InternalServerErrorException('Erro ao processar a transferência.');
    }
  }  
}
