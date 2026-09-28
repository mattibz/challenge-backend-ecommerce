import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import { Category } from './category.orm-entity';
import { Variant } from './variant.orm-entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: string;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: false,
  })
  category!: Category;

  @OneToMany(() => Variant, (variant) => variant.product)
  variants!: Variant[];
}