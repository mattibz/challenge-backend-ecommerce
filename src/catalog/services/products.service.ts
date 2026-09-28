import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.orm-entity';
import { Variant } from '../entities/variant.orm-entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Variant)
    private readonly variantRepository: Repository<Variant>,
  ) {}

  findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: { category: true },
      order: { name: 'ASC' },
    });
  }

  async findVariantsByProductId(productId: number): Promise<Variant[]> {
    const product = await this.productRepository.findOneBy({ id: productId });

    if (product === null) {
      throw new NotFoundException(`Product with ID ${productId} was not found`);
    }

    return this.variantRepository.find({
      where: { product: { id: productId } },
      order: { sku: 'ASC' },
    });
  }
}