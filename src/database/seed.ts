import { AppDataSource } from '../data-source';
import { Category } from '../catalog/entities/category.orm-entity';
import { Product } from '../catalog/entities/product.orm-entity';
import { Variant } from '../catalog/entities/variant.orm-entity';
import { StockMovement } from '../stock/entities/stock-movement.orm-entity';
import { StockMovementReason } from '../stock/enums/movement-reason.enum';

const seededVariants = [
  { sku: 'NIKE-42-RED', stock: 10 },
  { sku: 'NIKE-43-RED', stock: 8 },
  { sku: 'NIKE-42-BLACK', stock: 6 },
];

async function seed(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The development seed cannot run in production');
  }

  await AppDataSource.initialize();

  try {
    await AppDataSource.transaction(async (manager) => {
      const categoryRepository = manager.getRepository(Category);
      let category = await categoryRepository.findOneBy({ name: 'Zapatillas' });

      if (category === null) {
        category = await categoryRepository.save(
          categoryRepository.create({ name: 'Zapatillas' }),
        );
      }

      const productRepository = manager.getRepository(Product);
      let product = await productRepository.findOne({
        where: { name: 'Nike Air Max', category: { id: category.id } },
      });

      if (product === null) {
        product = await productRepository.save(
          productRepository.create({
            name: 'Nike Air Max',
            description: 'Zapatilla deportiva',
            price: '150000.00',
            category,
          }),
        );
      }

      const variantRepository = manager.getRepository(Variant);
      const movementRepository = manager.getRepository(StockMovement);
      let createdCount = 0;

      for (const seedVariant of seededVariants) {
        const existingVariant = await variantRepository.findOneBy({
          sku: seedVariant.sku,
        });

        if (existingVariant !== null) {
          continue;
        }

        const variant = await variantRepository.save(
          variantRepository.create({ ...seedVariant, product }),
        );
        await movementRepository.save(
          movementRepository.create({
            quantity: seedVariant.stock,
            reason: StockMovementReason.PURCHASE,
            variant,
          }),
        );
        createdCount += 1;
      }

      console.log(
        `Seed complete: ${createdCount} variants created, ${seededVariants.length - createdCount} already existed.`,
      );
    });
  } finally {
    await AppDataSource.destroy();
  }
}

void seed().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});