import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Variant } from '../catalog/entities/variant.orm-entity';
import { StockMovement } from './entities/stock-movement.orm-entity';
import { StockController } from './controllers/stock.controller';
import { StockService } from './services/stock.service';

@Module({
	imports: [TypeOrmModule.forFeature([Variant, StockMovement])],
	controllers: [StockController],
	providers: [StockService],
})
export class StockModule {}
