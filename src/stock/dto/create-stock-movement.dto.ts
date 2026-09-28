import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { StockMovementReason } from '../enums/movement-reason.enum';

@ValidatorConstraint({ name: 'movementDirection', async: false })
class MovementDirectionConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const { reason } = args.object as { reason: StockMovementReason };

    if (reason === StockMovementReason.MANUAL_ADJUSTMENT) {
      return value === 'in' || value === 'out';
    }

    return value === undefined;
  }

  defaultMessage(args: ValidationArguments): string {
    const { reason } = args.object as { reason: StockMovementReason };

    return reason === StockMovementReason.MANUAL_ADJUSTMENT
      ? 'direction is required for manual_adjustment and must be "in" or "out"'
      : 'direction is only allowed for manual_adjustment';
  }
}

export class CreateStockMovementDto {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsEnum(StockMovementReason)
  reason!: StockMovementReason;

  @Validate(MovementDirectionConstraint)
  direction?: 'in' | 'out';
}