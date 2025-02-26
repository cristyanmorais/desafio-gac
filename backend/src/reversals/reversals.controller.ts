import { Controller, Post, Body, Param, Patch } from '@nestjs/common';
import { ReversalsService } from './reversals.service';

@Controller('reversals')
export class ReversalsController {
  constructor(private readonly reversalsService: ReversalsService) {}

  @Post()
  async requestReversal(@Body() body: { transactionId: string; requesterId: string }) {
    return this.reversalsService.requestReversal(body.transactionId, body.requesterId);
  }

  @Patch(':id/approve')
  async approveReversal(@Param('id') reversalId: string, @Body() body: { approverId: string }) {
    return this.reversalsService.approveReversal(reversalId, body.approverId);
  }
}
