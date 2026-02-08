import { InventoryType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class InventoryMovementDto {
  @ApiProperty({
    example: 'uuid-product-123',
    description: 'Product ID',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    example: 'IN',
    enum: ['IN', 'OUT', 'ADJUSTMENT'],
    description: 'Type of inventory movement',
  })
  @IsEnum(InventoryType)
  @IsNotEmpty()
  type: InventoryType;

  @ApiProperty({
    example: 100,
    description: 'Quantity to move',
  })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({
    example: 'PO-2024-001',
    description: 'Reference number',
    required: false,
  })
  @IsOptional()
  @IsString()
  reference: string;

  @ApiProperty({
    example: 'Inventory adjustment note',
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  note: string;
}
