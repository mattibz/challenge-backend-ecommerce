import { BadRequestException, ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { Variant } from '../../catalog/entities/variant.orm-entity';
import { CreateStockMovementDto } from '../dto/create-stock-movement.dto';
import type { StockLevelResponseDto } from '../dto/stock-level-response.dto';
import { StockMovement } from '../entities/stock-movement.orm-entity';
import { StockMovementReason } from '../enums/movement-reason.enum';

@Injectable()
export class StockService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async createMovement(dto: CreateStockMovementDto): Promise<StockMovement> {
    const delta = this.calculateDelta(dto);

    return this.dataSource.transaction(async (manager) => {
      const variantRepository = manager.getRepository(Variant);
      const variant = await variantRepository.findOneBy({ sku: dto.sku });

      if (variant === null) {
        throw new NotFoundException(`Variant with SKU ${dto.sku} was not found`);
      }

      const updateResult = await variantRepository
        .createQueryBuilder()
        .update(Variant)
        .set({ stock: () => 'stock + :delta' })
        .where('id = :id AND stock + :delta >= 0', {
          id: variant.id,
          delta,
        })
        .execute();

      if (updateResult.affected === 0) {
        throw new ConflictException('Insufficient stock for this movement');
      }

      const updatedVariant = await variantRepository.findOneByOrFail({
        id: variant.id,
      });
      const movement = manager.create(StockMovement, {
        quantity: delta,
        reason: dto.reason,
        variant: updatedVariant,
      });

      return manager.save(StockMovement, movement);
    });
  }

  async getStockBySku(sku: string): Promise<StockLevelResponseDto> {
    const variant = await this.dataSource
      .getRepository(Variant)
      .findOneBy({ sku });

    if (variant === null) {
      throw new NotFoundException(`Variant with SKU ${sku} was not found`);
    }

    return { sku: variant.sku, stock: variant.stock };
  }

  private calculateDelta(dto: CreateStockMovementDto): number {
    switch (dto.reason) {
      case StockMovementReason.PURCHASE:
      case StockMovementReason.RETURN:
        return dto.quantity;
      case StockMovementReason.SALE:
        return -dto.quantity;
      case StockMovementReason.MANUAL_ADJUSTMENT:
        if (dto.direction === 'in') {
          return dto.quantity;
        }

        if (dto.direction === 'out') {
          return -dto.quantity;
        }

        throw new BadRequestException(
          'direction must be "in" or "out" for manual_adjustment',
        );
      default:
        throw new BadRequestException('Unsupported stock movement reason');
    }
  }
}