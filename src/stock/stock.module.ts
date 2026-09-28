import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Variant } from '../catalog/entities/variant.orm-entity';
import { StockMovement } from './entities/stock-movement.orm-entity';

@Module({
	imports: [TypeOrmModule.forFeature([Variant, StockMovement])],
})
export class StockModule {}
