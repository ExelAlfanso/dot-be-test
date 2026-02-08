import { ApiProperty } from '@nestjs/swagger';

class ProductInfoDto {
  @ApiProperty({ example: 'uuid-product-123', description: 'Product ID' })
  id: string;

  @ApiProperty({ example: 'Gaming Laptop', description: 'Product name' })
  name: string;

  @ApiProperty({ example: 1299.99, description: 'Product price' })
  price: number;

  @ApiProperty({ example: 150, description: 'Current stock' })
  stock: number;
}

export class InventoryMovementResponseDto {
  @ApiProperty({ example: 'uuid-movement-123', description: 'Movement ID' })
  id: string;

  @ApiProperty({ example: 'uuid-product-123', description: 'Product ID' })
  productId: string;

  @ApiProperty({
    example: 'IN',
    enum: ['IN', 'OUT', 'ADJUSTMENT'],
    description: 'Movement type',
  })
  type: string;

  @ApiProperty({ example: 100, description: 'Quantity moved' })
  quantity: number;

  @ApiProperty({
    example: 'PO-2024-001',
    description: 'Reference number',
    nullable: true,
  })
  reference: string | null;

  @ApiProperty({ example: 'uuid-user-123', description: 'Created by user ID' })
  createdBy: string;

  @ApiProperty({
    example: '2024-01-29T10:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    type: ProductInfoDto,
    description: 'Product information',
  })
  product: ProductInfoDto;
}
