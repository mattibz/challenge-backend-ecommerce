import { Controller, Get } from '@nestjs/common';
import { Category } from '../entities/category.orm-entity';
import { CategoriesService } from '../services/categories.service';

@Controller('catalog/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(): Promise<Category[]> {
    return this.categoriesService.findAll();
  }
}