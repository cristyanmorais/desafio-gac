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

    if (!sender || !receiver) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (sender.balance < amount) {
      throw new BadRequestException('Saldo insuficiente.');
    }

    sender.balance -= amount;
    receiver.balance += amount;

    const transaction = this.transactionRepository.create({ sender, receiver, amount, status: 'COMPLETED' });

    await this.transactionRepository.save(transaction);
    await this.usersService.create(sender.name, sender.email, sender.password_hash); // Atualiza saldo no banco
    await this.usersService.create(receiver.name, receiver.email, receiver.password_hash); // Atualiza saldo no banco

    return transaction;
  }
}
