import type { StockMovementReason } from '../enums/movement-reason.enum';

export interface VariantStockMovementResponseDto {
  id: number;
  sku: string;
  quantity: number;
  reason: StockMovementReason;
  createdAt: Date;
}