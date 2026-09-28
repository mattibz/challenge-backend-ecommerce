import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedProductsResponseDto } from '../dto/paginated-products-response.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
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

  async findAll(
    pagination: PaginationQueryDto,
  ): Promise<PaginatedProductsResponseDto> {
    const { page, limit } = pagination;
    const [items, total] = await this.productRepository.findAndCount({
      relations: { category: true },
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
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