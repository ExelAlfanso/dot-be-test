import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Gaming Laptop', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'High-performance gaming laptop with RTX 4080',
    description: 'Product description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1299.99, description: 'Product price' })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Initial stock quantity (max 9999)',
  })
  @IsOptional()
  @Max(9999)
  @IsNumber()
  stock?: number;
}
