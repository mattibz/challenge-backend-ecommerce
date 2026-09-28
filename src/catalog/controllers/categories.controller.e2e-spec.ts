import * as assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { Category } from '../entities/category.orm-entity';
import { Product } from '../entities/product.orm-entity';
import { Variant } from '../entities/variant.orm-entity';
import { StockMovement } from '../../stock/entities/stock-movement.orm-entity';
import { CatalogModule } from '../catalog.module';

void describe('CategoriesController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  void beforeEach(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Category, Product, Variant, StockMovement],
          synchronize: true,
        }),
        CatalogModule,
      ],
    }).compile();

    app = testingModule.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.getRepository(Category).save({ name: 'Footwear' });
  });

  void afterEach(async () => {
    await app.close();
  });

  void it('returns categories through GET /catalog/categories', async () => {
    const response = await request(app.getHttpServer())
      .get('/catalog/categories')
      .expect(200);

    assert.deepEqual(response.body, [{ id: 1, name: 'Footwear' }]);
  });
});