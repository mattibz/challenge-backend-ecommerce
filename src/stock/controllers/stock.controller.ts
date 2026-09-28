import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateStockMovementDto } from '../dto/create-stock-movement.dto';
import type { StockLevelResponseDto } from '../dto/stock-level-response.dto';
import { StockMovement } from '../entities/stock-movement.orm-entity';
import { StockService } from '../services/stock.service';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('movimientos')
  create(@Body() dto: CreateStockMovementDto): Promise<StockMovement> {
    return this.stockService.createMovement(dto);
  }

  @Get(':sku')
  getStock(@Param('sku') sku: string): Promise<StockLevelResponseDto> {
    return this.stockService.getStockBySku(sku);
  }
}