import { Controller, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReversalsService } from './reversals.service';
import { CreateReversalDto } from './dto/create-reversal.dto';
import { ReversalRequest } from './reversal.entity';

@ApiTags('reversals')
@ApiBearerAuth()
@Controller('reversals')
export class ReversalsController {
  constructor(private readonly reversalsService: ReversalsService) {}

  @Post('request')
  @ApiOperation({ summary: 'Solicitar reversão de transação' })
  @ApiResponse({ status: 201, description: 'Solicitação de reversão criada com sucesso', type: ReversalRequest })
  @ApiResponse({ status: 400, description: 'Requisição inválida: Detalhes da solicitação de reversão inválidos' })
  @ApiResponse({ status: 404, description: 'Não encontrado: Transação ou usuário não encontrado' })
  async requestReversal(@Body() createReversalDto: CreateReversalDto): Promise<ReversalRequest> {
    return this.reversalsService.requestReversal(createReversalDto.transactionId, createReversalDto.requesterId);
  }

  @Post('approve/:id')
  @ApiOperation({ summary: 'Aprovar reversão de transação' })
  @ApiResponse({ status: 200, description: 'Reversão aprovada com sucesso', type: ReversalRequest })
  @ApiResponse({ status: 400, description: 'Requisição inválida: Detalhes da aprovação inválidos' })
  @ApiResponse({ status: 404, description: 'Não encontrado: Solicitação de reversão não encontrada' })
  async approveReversal(@Param('id') id: string, @Body('approverId') approverId: string): Promise<ReversalRequest> {
    return this.reversalsService.approveReversal(id, approverId);
  }
}