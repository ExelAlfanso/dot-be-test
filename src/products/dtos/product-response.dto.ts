import { ApiProperty } from '@nestjs/swagger';

class UserInfoDto {
  @ApiProperty({ example: 'uuid-123', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'john_doe', description: 'Username' })
  username: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email' })
  email: string;
}

export class ProductResponseDto {
  @ApiProperty({ example: 'uuid-product-123', description: 'Product ID' })
  id: string;

  @ApiProperty({ example: 'Gaming Laptop', description: 'Product name' })
  name: string;

  @ApiProperty({
    example: 'High-performance gaming laptop',
    description: 'Product description',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ example: 1299.99, description: 'Product price' })
  price: number;

  @ApiProperty({ example: 50, description: 'Stock quantity' })
  stock: number;

  @ApiProperty({ example: 'uuid-user-123', description: 'Creator user ID' })
  createdBy: string;

  @ApiProperty({
    example: '2024-01-29T10:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-29T10:00:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  @ApiProperty({ type: UserInfoDto, description: 'Creator user information' })
  user: UserInfoDto;
}
