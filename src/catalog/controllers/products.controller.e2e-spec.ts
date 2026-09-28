import * as assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
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
    await dataSource.getRepository(Product).save({
      name: 'Trail Runner',
      description: 'Second test product',
      price: '120.00',
      category,
    });

    await dataSource.getRepository(Variant).save([
      { sku: 'SNEAKER-BLACK-42', stock: 4, product },
      { sku: 'SNEAKER-WHITE-42', stock: 7, product },
    ]);
  });

  void afterEach(async () => {
    await app.close();
  });

  void it('returns a paginated product list with categories', async () => {
    const response = await request(app.getHttpServer())
      .get('/catalog/products?page=1&limit=1')
      .expect(200);

    assert.equal(response.body.items.length, 1);
    assert.equal(response.body.items[0].name, 'Sneaker');
    assert.equal(response.body.items[0].category.name, 'Footwear');
    assert.equal(response.body.page, 1);
    assert.equal(response.body.limit, 1);
    assert.equal(response.body.total, 2);
    assert.equal(response.body.totalPages, 2);
  });

  void it('rejects invalid pagination parameters', async () => {
    await request(app.getHttpServer())
      .get('/catalog/products?page=0')
      .expect(400);
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