import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: 'sender-id' })
  @IsString()
  @IsNotEmpty()
  senderId: string;

  @ApiProperty({ example: 'receiver-id' })
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  amount: number;
}