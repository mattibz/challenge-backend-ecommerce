# ecommerce-challenge

---

## Enunciado

### Contexto

Una plataforma de ecommerce necesita gestionar su catálogo de productos y el stock disponible. Tu tarea es implementar una parte del backend usando NestJS.

### El dominio

La plataforma vende productos organizados en categorías. Un producto tiene un nombre, una descripción, un precio y pertenece a una categoría. Un producto puede tener variantes; por ejemplo, un mismo modelo de zapatilla existe en distintos talles y colores. Cada variante es la unidad que tiene stock propio y es la que el cliente agrega al carrito.

Cuando el stock de una variante cambia, el cambio tiene que quedar registrado: cuándo ocurrió, cuántas unidades se movieron y por qué motivo (por ejemplo una compra, una devolución o un ajuste manual). El sistema siempre tiene que poder responder cuánto stock hay disponible.

Cuando un cliente intenta agregar una variante al carrito, el sistema verifica si hay stock disponible. Si no hay, no puede agregarse.

### Lo que tenés que implementar

#### `POST /stock/movimientos`

El body llega con el SKU de la variante, la cantidad y el motivo. El sistema registra el movimiento y deja el stock disponible de esa variante en un estado correcto.

Definí vos cómo modelar cantidades, qué motivos aceptás y qué pasa cuando no hay stock suficiente para una salida.

### Stack esperado

- NestJS con TypeScript estricto
- TypeORM o Prisma
- PostgreSQL o SQLite

Se espera que el código tenga responsabilidades claras y bien separadas. Cómo lo estructurás queda a tu criterio.

### Entrega

Repositorio en GitHub con un historial de commits claro y legible — que se entienda cómo fuiste construyendo la solución — y documentación que refleje cómo pensaste el problema, cómo está organizado el sistema, las decisiones de diseño que tomaste y, si aplica, cómo correr o probar tu solución más allá de lo que ya describe este README.

El formato, ubicación y nivel de detalle quedan a tu criterio. Forma parte de la evaluación.

---

## About this repository

This repo is the starting point for the challenge. It includes NestJS 11, TypeORM 0.3, and support for SQLite (default) or PostgreSQL 17 (via Docker).

TypeScript is configured in strict mode with sensible additional rules (`noUncheckedIndexedAccess`, explicit return types, no `any`, no floating promises, etc.). Run `npm run typecheck` and `npm run lint` before submitting.

## Project structure

Two empty NestJS modules are included: `catalog` and `stock`. Use them, rename them, or reorganize — whatever fits your design.

## Requirements

- Node.js 22 LTS (`>=22`)
- npm >= 10

Use the version in `.nvmrc` if you rely on nvm:

```bash
nvm use
```

## Installation

```bash
npm install
cp .env.example .env
```

## Running the project

```bash
npm run start:dev
```

The app runs at `http://localhost:3000`. Verify it started with:

```bash
curl http://localhost:3000/health
```

## PostgreSQL with Docker (optional)

```bash
docker compose up -d
```

Then update `.env`:

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=ecommerce_challenge
```

## Migrations

By default the app uses `synchronize: true` in development for fast iteration. If you prefer migrations:

```bash
npm run migration:generate -- src/migrations/MigrationName
npm run migration:run
```

## Scripts

| Command              | Description           |
| -------------------- | --------------------- |
| `npm run start:dev`  | Dev server with watch |
| `npm run build`      | Compile               |
| `npm run lint`       | ESLint                |
| `npm run typecheck`  | Type checking         |

---

## changes

* Se crearon las entidades ORM de categorias, productos, variantes y movimientos de stock, junto con las relaciones entre ellas. Una categoria puede tener varios productos, un producto puede tener varias variantes y una variante puede tener varios movimientos de stock. Cada variante tiene un `sku` único y mantiene su stock actual para poder consultarlo directamente, mientras que `StockMovement` guarda el historial de los cambios realizados sobre ese stock, incluyendo la cantidad, el motivo y la fecha.


* Se creo `CreateStockMovementDto` para definir y validar el contrato de entrada del endpoint de movimientos de stock. Valida que `sku` sea obligatorio y no vacio, que `quantity` sea un entero positivo con un minimo de 1 y que `reason` pertenezca al enum `StockMovementReason`. El campo `direction` acepta unicamente `in` o `out`, es obligatorio para `manual_adjustment` y no se permite para el resto de los motivos. Se agrego este flag extra porque un ajuste manual puede incrementar o disminuir el stock. Se decidio no utilizar signos en `quantity`, ya que este campo representa unicamente la cantidad de unidades involucradas en el movimiento, mientras que la direccion del movimiento se expresa mediante `direction` cuando es necesaria.Ademas, podia generar combinaciones inconsistentes con `reason`

* Se creo StockService como responsable de la lógica de negocio relacionada con los movimientos de stock. Se inyectaron los repositorios de Variant y StockMovement para poder consultar variantes por SKU y persistir los movimientos. En esta etapa se dejo preparada la estructura/esqueleto del servicio. la lógica para actualizar el stock y registrar movimientos se implementara posteriormente

* Se implemento el servicio para manejar los movimientos de stock. El servicio busca la variante por su SKU, calcula si el movimiento suma o resta stock, actualiza la cantidad disponible y guarda el movimiento en el historial. La actualizacion del stock y el registro del movimiento se hacen dentro de una misma transacción para evitar inconsistencias entre el stock y su historial. Si algo falla, se hace un rollback y se deshacen los cambios realizados. Ademas, se evita que el stock quede negativo y, si no hay suficiente stock, la operacion devuelve un `409 Conflict` sin modificar el stock ni crear un movimiento. Se agregaron 7 tests: se verifica que una entrada de stock aumente el saldo, que una venta lo disminuya, que un SKU inexistente devuelva `404`, que una cantidad `0` sea rechazada con `400`, que un movimiento válido cree un registro en `StockMovement`, que una salida mayor al stock disponible devuelva `409` y mantenga el stock sin cambios, y que una salida rechazada no cree un movimiento en el historial. se cubre race conditions y no justifica para este caso hacer un strategy en el switch del service.

* Se agrego controller con metodos post de movimientos y get para consultar el current stock por id de sku y se implementaron tests e2e para levantar StockModule con SQLite en memoria y envía requests HTTP con Supertest y el ValidationPipe global: comprueba que crear un movimiento válido devuelve 201, consultar stock devuelve el SKU y el saldo, un body inválido devuelve 400, un SKU inexistente devuelve 404 y una venta sin stock responde 409 sin cambiar el saldo