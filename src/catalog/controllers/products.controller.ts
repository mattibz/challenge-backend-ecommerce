import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { Product } from '../entities/product.orm-entity';
import { Variant } from '../entities/variant.orm-entity';
import { ProductsService } from '../services/products.service';

@Controller('catalog/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  @Get(':productId/variants')
  findVariants(
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<Variant[]> {
    return this.productsService.findVariantsByProductId(productId);
  }
}