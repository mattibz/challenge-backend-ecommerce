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

void describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let productId: number;

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

    const dataSource = app.get(DataSource);
    const category = await dataSource
      .getRepository(Category)
      .save({ name: 'Footwear' });
    const product = await dataSource.getRepository(Product).save({
      name: 'Sneaker',
      description: 'Test product',
      price: '99.90',
      category,
    });
    productId = product.id;

    await dataSource.getRepository(Variant).save([
      { sku: 'SNEAKER-BLACK-42', stock: 4, product },
      { sku: 'SNEAKER-WHITE-42', stock: 7, product },
    ]);
  });

  void afterEach(async () => {
    await app.close();
  });

  void it('returns products with their category through GET /catalog/products', async () => {
    const response = await request(app.getHttpServer())
      .get('/catalog/products')
      .expect(200);

    assert.equal(response.body.length, 1);
    assert.equal(response.body[0].name, 'Sneaker');
    assert.equal(response.body[0].category.name, 'Footwear');
  });

  void it('returns variants for a product', async () => {
    const response = await request(app.getHttpServer())
      .get(`/catalog/products/${productId}/variants`)
      .expect(200);

    assert.deepEqual(
      response.body.map((variant: Variant) => variant.sku),
      ['SNEAKER-BLACK-42', 'SNEAKER-WHITE-42'],
    );
  });

  void it('returns 404 for variants of an unknown product', async () => {
    await request(app.getHttpServer())
      .get('/catalog/products/9999/variants')
      .expect(404);
  });
});