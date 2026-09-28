import type { Product } from '../entities/product.orm-entity';

export interface PaginatedProductsResponseDto {
  items: Product[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}