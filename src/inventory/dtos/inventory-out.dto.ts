import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InventoryOutDto {
  @ApiProperty({
    example: 'uuid-product-123',
    description: 'Product ID',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    example: 25,
    description: 'Quantity to remove from inventory',
  })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({
    example: 'SO-2024-005',
    description: 'Reference number (e.g., Sales Order number)',
    required: false,
  })
  @IsOptional()
  @IsString()
  reference: string;

  @ApiProperty({
    example: 'Shipped to customer',
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  note: string;
}
