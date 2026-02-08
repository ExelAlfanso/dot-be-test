import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InventoryInDto {
  @ApiProperty({
    example: 'uuid-product-123',
    description: 'Product ID',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    example: 50,
    description: 'Quantity to add to inventory',
  })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({
    example: 'PO-2024-001',
    description: 'Reference number (e.g., Purchase Order number)',
    required: false,
  })
  @IsOptional()
  @IsString()
  reference: string;

  @ApiProperty({
    example: 'Received from warehouse',
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  note: string;
}
