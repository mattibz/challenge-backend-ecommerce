# Diseño y decisiones

## Arquitectura

La aplicación está organizada por dominios utilizando la arquitectura modular de NestJS:

```text
Controller → Service → Repository → Database
```

* **Controller:** recibe las requests HTTP y delega la operación.
* **Service:** contiene la lógica de negocio.
* **Repository:** encapsula el acceso a la base de datos mediante TypeORM.
* **DTO:** define y valida los datos de entrada.
* **Entity:** representa el modelo persistido.

Los principales módulos son **Catalog** y **Stock**, manteniendo separadas sus responsabilidades.

## Stock y concurrencia

El stock se mantiene a nivel de **variante/SKU** y los cambios se registran mediante `StockMovement`.

Para evitar problemas de concurrencia (**race conditions**), las operaciones que modifican el stock se realizan dentro de una transacción. Si alguna validación o parte de la operación falla, se realiza un **rollback**, evitando que quede un estado inconsistente en la base de datos.

Esto permite, por ejemplo, rechazar una venta por stock insuficiente sin modificar parcialmente el stock ni registrar un movimiento que no corresponda.

## Testing

Se utilizaron dos niveles de testing:

* **Tests unitarios:** verifican la lógica de negocio de los services de forma aislada.
* **Tests E2E:** verifican el flujo completo desde HTTP hasta la base de datos.

```text
HTTP → Controller → Validation → Service → Repository → Database
```

Los tests E2E cubren, entre otros:

* Creación de movimientos.
* Consulta del stock actual.
* Datos inválidos.
* SKU inexistente.
* Stock insuficiente.
* Verificación de que una operación rechazada no modifica el stock.

Los tests utilizan SQLite en memoria para mantener un entorno aislado y reproducible.

## Decisiones

Se priorizó una solución simple y extensible, manteniendo separadas las responsabilidades entre controllers, services y repositories.

Se evitó agregar abstracciones innecesarias para el alcance del challenge, dejando como posibles extensiones futuras filtros, autenticación, migraciones etc.
