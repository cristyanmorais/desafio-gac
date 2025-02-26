import { Controller, Post, Body } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async transfer(
    @Body() body: { senderId: string; receiverId: string; amount: number },
  ) {
    return this.transactionsService.transfer(body.senderId, body.receiverId, body.amount);
  }
}
