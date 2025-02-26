import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { User } from '../users/user.entity';

@Entity()
export class ReversalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Transaction, { nullable: false })
  transaction: Transaction;

  @ManyToOne(() => User, { nullable: false })
  requester: User;

  @ManyToOne(() => User, { nullable: true })
  approver?: User;

  @Column({ default: 'PENDING' }) // PENDING, APPROVED, REJECTED
  status: string;

  @CreateDateColumn()
  created_at: Date;
}