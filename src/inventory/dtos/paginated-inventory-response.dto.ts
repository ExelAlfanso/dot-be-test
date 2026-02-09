import { ApiProperty } from '@nestjs/swagger';
import { InventoryMovementResponseDto } from './inventory-response.dto';

class PaginationMetaDto {
  @ApiProperty({ example: 100, description: 'Total number of movements' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Items per page' })
  limit: number;

  @ApiProperty({ example: 10, description: 'Total number of pages' })
  totalPages: number;
}

export class PaginatedInventoryMovementsResponseDto {
  @ApiProperty({ type: [InventoryMovementResponseDto] })
  data: InventoryMovementResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
