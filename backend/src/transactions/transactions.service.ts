import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class TransactionsService {
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

    console.log("TS - original sender balance: ", typeof(sender.balance));
    console.log("TS - original receiver balance: ", typeof(receiver.balance));
  
    if (!sender || !receiver) {
      throw new NotFoundException('Usuário não encontrado.');
    }
  
    if (sender.balance < amount) {
      throw new BadRequestException('Saldo insuficiente.');
    }
  
    // Atualizando os saldos
    sender.balance = Number(sender.balance) - amount;
    receiver.balance = Number(receiver.balance) + amount;
    console.log("TS - receiver balance: ", typeof(receiver.balance));
    console.log("TS - sender balance: ", typeof(sender.balance));

    // Salvando os usuários no banco
    await this.usersService.updateBalance(sender.id, sender.balance);
    await this.usersService.updateBalance(receiver.id, receiver.balance);
  
    // Criando a transação
    const transaction = this.transactionRepository.create({
      sender,
      receiver,
      amount,
      status: 'COMPLETED',
    });
  
    return this.transactionRepository.save(transaction);
  }  
}
