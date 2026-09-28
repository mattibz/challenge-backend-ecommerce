import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Variant } from '../entities/variant.orm-entity';
import type { PaginatedProductsResponseDto } from '../dto/paginated-products-response.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { ProductsService } from '../services/products.service';

@Controller('catalog/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query() pagination: PaginationQueryDto,
  ): Promise<PaginatedProductsResponseDto> {
    return this.productsService.findAll(pagination);
  }

  @Get(':productId/variants')
  findVariants(
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<Variant[]> {
    return this.productsService.findVariantsByProductId(productId);
  }
}