import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Variant } from '../../catalog/entities/variant.orm-entity';
import { StockMovement } from '../entities/stock-movement.orm-entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Variant)
    private readonly variantRepository: Repository<Variant>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
  ) {}

  findVariantBySku(sku: string): Promise<Variant | null> {
    return this.variantRepository.findOneBy({ sku });
  }

  saveMovement(movement: StockMovement): Promise<StockMovement> {
    return this.stockMovementRepository.save(movement);
  }
}