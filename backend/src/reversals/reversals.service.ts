import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReversalRequest } from './reversal.entity';
import { Transaction } from '../transactions/transaction.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ReversalsService {
  constructor(
    @InjectRepository(ReversalRequest)
    private readonly reversalRepository: Repository<ReversalRequest>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly usersService: UsersService,
  ) {}

  async requestReversal(transactionId: string, requesterId: string): Promise<ReversalRequest> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['sender', 'receiver'],
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada.');
    }

    const requester = await this.usersService.findById(requesterId);

    if (!requester) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (transaction.status === 'REVERSED') {
      throw new BadRequestException('Esta transação já foi revertida.');
    }

    if (requester.id !== transaction.sender.id && requester.id !== transaction.receiver.id) {
      throw new BadRequestException('Apenas envolvidos na transação podem solicitar reversão.');
    }

    if (!transaction) {
        throw new NotFoundException('Transação não encontrada.');
      }
      
      if (!requester) {
        throw new NotFoundException('Usuário solicitante não encontrado.');
      }
      
      const reversal = this.reversalRepository.create({
        transaction,
        requester,
      });      

    await this.reversalRepository.save(reversal);

    if (reversal.status === 'APPROVED') {
      await this.processReversal(transaction);
    }

    return reversal;
  }

  async approveReversal(reversalId: string, approverId: string): Promise<ReversalRequest> {
    const reversal = await this.reversalRepository.findOne({
      where: { id: reversalId },
      relations: ['transaction', 'approver', 'transaction.receiver', 'transaction.sender'],
    });

    if (!reversal) {
      throw new NotFoundException('Pedido de reversão não encontrado.');
    }

    if (reversal.transaction.receiver.id !== approverId) {
      throw new BadRequestException('Somente o beneficiário pode aprovar esta reversão.');
    }

    reversal.status = 'APPROVED';
    await this.reversalRepository.save(reversal);

    await this.processReversal(reversal.transaction);

    return reversal;
  }

  private async processReversal(transaction: Transaction) {
    const sender = await this.usersService.findById(transaction.sender.id);
    const receiver = await this.usersService.findById(transaction.receiver.id);

    if (!sender || !receiver) {
        throw new NotFoundException('Usuário não encontrado para reversão.');
    }

    transaction.status = 'REVERSED';
    await this.transactionRepository.save(transaction);

    sender.balance = Number(sender.balance) + Number(transaction.amount);
    receiver.balance = Number(receiver.balance) - Number(transaction.amount);

    await this.usersService.updateBalance(sender.id, sender.balance);
    await this.usersService.updateBalance(receiver.id, receiver.balance);
  }
}