import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.orm-entity';
import { Product } from './entities/product.orm-entity';
import { Variant } from './entities/variant.orm-entity';
import { CategoriesController } from './controllers/categories.controller';
import { ProductsController } from './controllers/products.controller';
import { CategoriesService } from './services/categories.service';
import { ProductsService } from './services/products.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Category,
			Product,
			Variant,
		]),
	],
	controllers: [CategoriesController, ProductsController],
	providers: [CategoriesService, ProductsService],
})
export class CatalogModule {}
