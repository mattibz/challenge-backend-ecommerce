import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import { Variant } from '../../catalog/entities/variant.orm-entity';
import { StockMovementReason } from '../enums/movement-reason.enum';

@Entity()
export class StockMovement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ type: 'simple-enum', enum: StockMovementReason })
  reason!: StockMovementReason;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Variant, (variant) => variant.stockMovements, {
    nullable: false,
  })
  variant!: Variant;
}