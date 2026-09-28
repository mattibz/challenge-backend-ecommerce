import * as assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { Category } from '../../catalog/entities/category.orm-entity';
import { Product } from '../../catalog/entities/product.orm-entity';
import { Variant } from '../../catalog/entities/variant.orm-entity';
import { CatalogModule } from '../../catalog/catalog.module';
import { StockMovement } from '../entities/stock-movement.orm-entity';
import { StockModule } from '../stock.module';

void describe('StockController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let sku: string;

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
        StockModule,
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
    dataSource = app.get(DataSource);
    sku = 'ZAP-001-42';

    const category = await dataSource
      .getRepository(Category)
      .save({ name: 'Footwear' });
    const product = await dataSource.getRepository(Product).save({
      name: 'Sneaker',
      description: 'Test product',
      price: '99.90',
      category,
    });
    await dataSource.getRepository(Variant).save({
      sku,
      stock: 5,
      product,
    });
  });

  void afterEach(async () => {
    await app.close();
  });

  void it('creates a movement through POST /stock/movimientos', async () => {
    const response = await request(app.getHttpServer())
      .post('/stock/movimientos')
      .send({ sku, quantity: 2, reason: 'purchase' })
      .expect(201);

    assert.equal(response.body.quantity, 2);
    assert.equal(response.body.reason, 'purchase');
    assert.equal(response.body.variant.sku, sku);
  });

  void it('returns current stock through GET /stock/:sku', async () => {
    const response = await request(app.getHttpServer())
      .get(`/stock/${sku}`)
      .expect(200);

    assert.deepEqual(response.body, { sku, stock: 5 });
  });

  void it('returns 400 for an invalid movement body', async () => {
    await request(app.getHttpServer())
      .post('/stock/movimientos')
      .send({ sku, quantity: 0, reason: 'purchase' })
      .expect(400);
  });

  void it('returns 404 when the SKU does not exist', async () => {
    await request(app.getHttpServer()).get('/stock/UNKNOWN-SKU').expect(404);
  });

  void it('returns 409 when a sale exceeds available stock', async () => {
    await request(app.getHttpServer())
      .post('/stock/movimientos')
      .send({ sku, quantity: 6, reason: 'sale' })
      .expect(409);

    const variant = await dataSource
      .getRepository(Variant)
      .findOneByOrFail({ sku });
    assert.equal(variant.stock, 5);
  });
});