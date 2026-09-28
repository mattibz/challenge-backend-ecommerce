import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import { StockMovement } from '../../stock/entities/stock-movement.orm-entity';
import { Product } from './product.orm-entity';

@Entity()
export class Variant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  sku!: string;

  @Column({ type: 'integer', default: 0 })
  stock!: number;

  @ManyToOne(() => Product, (product) => product.variants, {
    nullable: false,
  })
  product!: Product;

  @OneToMany(() => StockMovement, (movement) => movement.variant)
  stockMovements!: StockMovement[];
}