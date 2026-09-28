import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Variant } from '../catalog/entities/variant.orm-entity';
import { StockMovement } from './entities/stock-movement.orm-entity';
import { StockService } from './services/stock.service';

@Module({
	imports: [TypeOrmModule.forFeature([Variant, StockMovement])],
	providers: [StockService],
})
export class StockModule {}
