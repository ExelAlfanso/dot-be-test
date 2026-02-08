import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  IsOptional,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({
    example: 'Gaming Laptop Pro',
    description: 'Product name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Updated description with new features',
    description: 'Product description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1199.99, description: 'Product price' })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({
    example: 75,
    description: 'Stock quantity (max 9999)',
  })
  @IsOptional()
  @Max(9999)
  @IsNumber()
  stock?: number;
}
