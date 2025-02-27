import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReversalDto {
  @ApiProperty({ example: 'transaction-id' })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({ example: 'requester-id' })
  @IsString()
  @IsNotEmpty()
  requesterId: string;
}