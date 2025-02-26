import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReversalsService } from './reversals.service';
import { ReversalsController } from './reversals.controller';
import { ReversalRequest } from './reversal.entity';
import { Transaction } from '../transactions/transaction.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReversalRequest, Transaction]),
    UsersModule,
  ],
  controllers: [ReversalsController],
  providers: [ReversalsService],
})

export class ReversalsModule {}