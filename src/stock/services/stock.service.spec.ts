import * as assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { BadRequestException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Category } from '../../catalog/entities/category.orm-entity';
import { Product } from '../../catalog/entities/product.orm-entity';
import { Variant } from '../../catalog/entities/variant.orm-entity';
import { CreateStockMovementDto } from '../dto/create-stock-movement.dto';
import { StockMovement } from '../entities/stock-movement.orm-entity';
import { StockMovementReason } from '../enums/movement-reason.enum';
import { StockService } from './stock.service';

void describe('StockService', () => {
  let dataSource: DataSource;
  let stockService: StockService;
  let variant: Variant;

  void beforeEach(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [Category, Product, Variant, StockMovement],
      synchronize: true,
    });
    await dataSource.initialize();

    const category = await dataSource
      .getRepository(Category)
      .save({ name: 'Footwear' });
    const product = await dataSource.getRepository(Product).save({
      name: 'Sneaker',
      description: 'Test product',
      price: '99.90',
      category,
    });
    variant = await dataSource.getRepository(Variant).save({
      sku: 'ZAP-001-42',
      stock: 10,
      product,
    });
    stockService = new StockService(dataSource);
  });

  void afterEach(async () => {
    await dataSource.destroy();
  });

  void it('increases stock for a purchase', async () => {
    await stockService.createMovement(
      createDto(variant.sku, 5, StockMovementReason.PURCHASE),
    );

    assert.equal(await getStock(dataSource, variant.id), 15);
  });

  void it('decreases stock for a sale', async () => {
    await stockService.createMovement(
      createDto(variant.sku, 3, StockMovementReason.SALE),
    );

    assert.equal(await getStock(dataSource, variant.id), 7);
  });

  void it('returns the current stock for an existing SKU', async () => {
    assert.deepEqual(await stockService.getStockBySku(variant.sku), {
      sku: variant.sku,
      stock: 10,
    });
  });

  void it('returns 404 when reading stock for an unknown SKU', async () => {
    await assert.rejects(
      stockService.getStockBySku('UNKNOWN-SKU'),
      (error: unknown) =>
        error instanceof NotFoundException && error.getStatus() === 404,
    );
  });

  void it('returns 404 for an unknown SKU', async () => {
    await assert.rejects(
      stockService.createMovement(
        createDto('UNKNOWN-SKU', 1, StockMovementReason.PURCHASE),
      ),
      (error: unknown) =>
        error instanceof NotFoundException && error.getStatus() === 404,
    );
  });

  void it('rejects quantity zero with a 400 validation error', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    await assert.rejects(
      pipe.transform(
        createDto(variant.sku, 0, StockMovementReason.PURCHASE),
        {
          type: 'body',
          metatype: CreateStockMovementDto,
          data: undefined,
        },
      ),
      (error: unknown) =>
        error instanceof BadRequestException && error.getStatus() === 400,
    );
  });

  void it('creates a StockMovement for a valid movement', async () => {
    await stockService.createMovement(
      createDto(variant.sku, 5, StockMovementReason.PURCHASE),
    );

    const movements = await dataSource.getRepository(StockMovement).find({
      where: { variant: { id: variant.id } },
    });
    assert.equal(movements.length, 1);
    assert.equal(movements[0]?.quantity, 5);
  });

  void it('does not change stock when an outgoing movement exceeds available stock', async () => {
    await assert.rejects(
      stockService.createMovement(
        createDto(variant.sku, 11, StockMovementReason.SALE),
      ),
    );

    assert.equal(await getStock(dataSource, variant.id), 10);
  });

  void it('does not create a StockMovement when an outgoing movement fails', async () => {
    await assert.rejects(
      stockService.createMovement(
        createDto(variant.sku, 11, StockMovementReason.SALE),
      ),
    );

    const movementCount = await dataSource
      .getRepository(StockMovement)
      .count({ where: { variant: { id: variant.id } } });
    assert.equal(movementCount, 0);
  });
});

function createDto(
  sku: string,
  quantity: number,
  reason: StockMovementReason,
): CreateStockMovementDto {
  return Object.assign(new CreateStockMovementDto(), { sku, quantity, reason });
}

async function getStock(dataSource: DataSource, variantId: number): Promise<number> {
  const currentVariant = await dataSource
    .getRepository(Variant)
    .findOneByOrFail({ id: variantId });
  return currentVariant.stock;
}