# ecommerce-challenge

---

## changelog

* Se crearon las entidades ORM de categorias, productos, variantes y movimientos de stock, junto con las relaciones entre ellas. Una categoria puede tener varios productos, un producto puede tener varias variantes y una variante puede tener varios movimientos de stock. Cada variante tiene un `sku` único y mantiene su stock actual para poder consultarlo directamente, mientras que `StockMovement` guarda el historial de los cambios realizados sobre ese stock, incluyendo la cantidad, el motivo y la fecha.


* Se creo `CreateStockMovementDto` para definir y validar el contrato de entrada del endpoint de movimientos de stock. Valida que `sku` sea obligatorio y no vacio, que `quantity` sea un entero positivo con un minimo de 1 y que `reason` pertenezca al enum `StockMovementReason`. El campo `direction` acepta unicamente `in` o `out`, es obligatorio para `manual_adjustment` y no se permite para el resto de los motivos. Se agrego este flag extra porque un ajuste manual puede incrementar o disminuir el stock. Se decidio no utilizar signos en `quantity`, ya que este campo representa unicamente la cantidad de unidades involucradas en el movimiento, mientras que la direccion del movimiento se expresa mediante `direction` cuando es necesaria.Ademas, podia generar combinaciones inconsistentes con `reason`

* Se creo StockService como responsable de la lógica de negocio relacionada con los movimientos de stock. Se inyectaron los repositorios de Variant y StockMovement para poder consultar variantes por SKU y persistir los movimientos. En esta etapa se dejo preparada la estructura/esqueleto del servicio. la lógica para actualizar el stock y registrar movimientos se implementara posteriormente

* Se implemento el servicio para manejar los movimientos de stock. El servicio busca la variante por su SKU, calcula si el movimiento suma o resta stock, actualiza la cantidad disponible y guarda el movimiento en el historial. La actualizacion del stock y el registro del movimiento se hacen dentro de una misma transacción para evitar inconsistencias entre el stock y su historial. Si algo falla, se hace un rollback y se deshacen los cambios realizados. Ademas, se evita que el stock quede negativo y, si no hay suficiente stock, la operacion devuelve un `409 Conflict` sin modificar el stock ni crear un movimiento. Se agregaron 7 tests: se verifica que una entrada de stock aumente el saldo, que una venta lo disminuya, que un SKU inexistente devuelva `404`, que una cantidad `0` sea rechazada con `400`, que un movimiento válido cree un registro en `StockMovement`, que una salida mayor al stock disponible devuelva `409` y mantenga el stock sin cambios, y que una salida rechazada no cree un movimiento en el historial. se cubre race conditions y no justifica para este caso hacer un strategy en el switch del service.

* Se agrego controller con metodos post de movimientos y get para consultar el current stock por id de sku y se implementaron tests e2e para levantar StockModule con SQLite en memoria y envía requests HTTP con Supertest y el ValidationPipe global: comprueba que crear un movimiento válido devuelve 201, consultar stock devuelve el SKU y el saldo, un body inválido devuelve 400, un SKU inexistente devuelve 404 y una venta sin stock responde 409 sin cambiar el saldo

---

## Seed de datos

```bash
npm run start:dev
```
arranca el proyecto y genera via synchronize toda la db

aghregamos comando

```bash
npm run seed
```
genera data en la base deberias ver algo como Seed complete: 3 variants created, 0 already existed


No usamos migrations en el flujo de desarrollo: al iniciar la aplicacion con `synchronize: true`, TypeORM genera las tablas a partir de las entidades. El seed reutiliza `AppDataSource` y solo carga datos. no modifica el esquema. En una base nueva se inicia la aplicacion una vez para que se creen las tablas antes de ejecutar `npm run seed`. El seed agrega una categoría, un producto y tres variantes, cada una con su movimiento inicial de compra. Es idempotente por SKU, no duplica ni reinicia variantes existentes. Esta bloqueado cuando `NODE_ENV=production`.
database.sqlite esta en el .gitignore se genera uno cuando se levanta la app.

---

## evidencia 

### Health

```bash
curl --location 'http://localhost:3000/health'
```

```bash
response
{
    "status": "ok"
}
```
### GET /stock/:sku

```bash
curl --location 'http://localhost:3000/stock/NIKE-42-RED'
```

```bash
{
    "sku": "NIKE-42-RED",
    "stock": 10
}
```

### GET /stock/:sku - check invalid sku

```bash
curl --location 'http://localhost:3000/stock/NIKE-42-BLUE'
```

```bash
{
    "message": "Variant with SKU NIKE-42-BLUE was not found",
    "error": "Not Found",
    "statusCode": 404
}
```

---

### POST /stock/movimientos - Compra suma 2 unidades

```bash
curl --location 'http://localhost:3000/stock/movimientos' --header 'Content-Type: application/json' --data '{"sku":"NIKE-42-RED","quantity":2,"reason":"purchase"}'
```

```bash
{
    "quantity": 2,
    "reason": "purchase",
    "variant": {
        "id": 1,
        "sku": "NIKE-42-RED",
        "stock": 12
    },
    "id": 4,
    "createdAt": "2026-09-28T15:05:18.000Z"
}
```
### POST /stock/movimientos - Devolución suma 1 unidad

```bash
curl --location 'http://localhost:3000/stock/movimientos' --header 'Content-Type: application/json' --data '{"sku":"NIKE-42-RED","quantity":1,"reason":"return"}'
```
```bash
{
    "quantity": 1,
    "reason": "return",
    "variant": {
        "id": 1,
        "sku": "NIKE-42-RED",
        "stock": 13
    },
    "id": 5,
    "createdAt": "2026-09-28T15:10:11.000Z"
}
```
### POST /stock/movimientos - Venta descuenta 2 unidades

```bash
curl --location 'http://localhost:3000/stock/movimientos' --header 'Content-Type: application/json' --data '{"sku":"NIKE-42-RED","quantity":2,"reason":"sale"}'
```

```bash
{
    "quantity": -2,
    "reason": "sale",
    "variant": {
        "id": 1,
        "sku": "NIKE-42-RED",
        "stock": 11
    },
    "id": 6,
    "createdAt": "2026-09-28T15:15:00.000Z"
}
```

### POST /stock/movimientos - Ajuste manual de entrada - suma 3 unidades

```bash
curl --location 'http://localhost:3000/stock/movimientos' --header 'Content-Type: application/json' --data '{"sku":"NIKE-42-RED","quantity":3,"reason":"manual_adjustment","direction":"in"}'
```
```bash
{
    "quantity": 3,
    "reason": "manual_adjustment",
    "variant": {
        "id": 1,
        "sku": "NIKE-42-RED",
        "stock": 14
    },
    "id": 7,
    "createdAt": "2026-09-28T15:16:38.000Z"
}
```

### POST /stock/movimientos - Ajuste manual de salida - resta una unidad

```bash
curl --location 'http://localhost:3000/stock/movimientos' --header 'Content-Type: application/json' --data '{"sku":"NIKE-42-RED","quantity":1,"reason":"manual_adjustment","direction":"out"}'
```
```bash
{
    "quantity": -1,
    "reason": "manual_adjustment",
    "variant": {
        "id": 1,
        "sku": "NIKE-42-RED",
        "stock": 13
    },
    "id": 8,
    "createdAt": "2026-09-28T15:17:50.000Z"
}
```


### POST /stock/movimientos - Check quantity validation

```bash
curl --location 'http://localhost:3000/stock/movimientos' --header 'Content-Type: application/json' --data '{"sku":"NIKE-42-RED","quantity":0,"reason":"purchase"}'
```
```bash
{
    "message": [
        "quantity must not be less than 1"
    ],
    "error": "Bad Request",
    "statusCode": 400
}
```

### POST /stock/movimientos - Check stock validation

```bash
curl --location 'http://localhost:3000/stock/movimientos' --header 'Content-Type: application/json' --data '{"sku":"NIKE-42-RED","quantity":9999,"reason":"sale"}'
```

```bash
{
    "message": "Insufficient stock for this movement",
    "error": "Conflict",
    "statusCode": 409
}
```

### POST /stock/movimientos - invalid sku validation

```bash
curl --location 'http://localhost:3000/stock/movimientos' --header 'Content-Type: application/json' --data '{"sku":"SKU-INEXISTENTE","quantity":1,"reason":"purchase"}'
```

```bash
{
    "message": "Variant with SKU SKU-INEXISTENTE was not found",
    "error": "Not Found",
    "statusCode": 404
}
```

## EP extra

### GET - /catalog/categories - consulta de categorias

```bash
curl --location 'http://localhost:3000/catalog/categories'
```

```bash
[
    {
        "id": 1,
        "name": "Zapatillas"
    }
]
```

### GET -  /catalog/products - consulta todos los productos con su categoría y pagiacion 

```bash
curl --location 'http://localhost:3000/catalog/products?page=1&limit=10'
```

```bash
{
    "items": [
        {
            "id": 1,
            "name": "Nike Air Max",
            "description": "Zapatilla deportiva",
            "price": 150000,
            "category": {
                "id": 1,
                "name": "Zapatillas"
            }
        }
    ],
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
}
```

### GET -  /catalog/products/:productId/variants - consulta las variantes del producto ordenadas por SKU. Si el producto no existe, responde 404. si existe pero no tiene variantes, devuelve [].

```bash
curl --location 'http://localhost:3000/catalog/products/1/variants'
```
```bash
[
    {
        "id": 3,
        "sku": "NIKE-42-BLACK",
        "stock": 6
    },
    {
        "id": 1,
        "sku": "NIKE-42-RED",
        "stock": 13
    },
    {
        "id": 2,
        "sku": "NIKE-43-RED",
        "stock": 8
    }
]
```

### GET - /stock/products/:productId/movements - lista el hisorico de movimientos por un sku

```bash
curl --location 'http://localhost:3000/stock/variants/NIKE-42-RED/movements'
```
```bash
[
    {
        "id": 8,
        "sku": "NIKE-42-RED",
        "quantity": -1,
        "reason": "manual_adjustment",
        "createdAt": "2026-09-28T15:17:50.000Z"
    },
    {
        "id": 7,
        "sku": "NIKE-42-RED",
        "quantity": 3,
        "reason": "manual_adjustment",
        "createdAt": "2026-09-28T15:16:38.000Z"
    },
    {
        "id": 6,
        "sku": "NIKE-42-RED",
        "quantity": -2,
        "reason": "sale",
        "createdAt": "2026-09-28T15:15:00.000Z"
    },
    {
        "id": 5,
        "sku": "NIKE-42-RED",
        "quantity": 1,
        "reason": "return",
        "createdAt": "2026-09-28T15:10:11.000Z"
    },
    {
        "id": 4,
        "sku": "NIKE-42-RED",
        "quantity": 2,
        "reason": "purchase",
        "createdAt": "2026-09-28T15:05:18.000Z"
    },
    {
        "id": 1,
        "sku": "NIKE-42-RED",
        "quantity": 10,
        "reason": "purchase",
        "createdAt": "2026-09-28T14:46:53.000Z"
    }
]
```