import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from './transaction.entity';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('transfer')
  @ApiOperation({ summary: 'Transferência entre usuários' })
  @ApiResponse({ status: 201, description: 'Transferência concluída com sucesso', type: Transaction })
  @ApiResponse({ status: 400, description: 'Requisição inválida: Detalhes da transferência inválidos' })
  @ApiResponse({ status: 404, description: 'Não encontrado: Usuário não encontrado' })
  async transfer(@Body() createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    return this.transactionsService.transfer(
      createTransactionDto.senderId,
      createTransactionDto.receiverId,
      createTransactionDto.amount,
    );
  }
}