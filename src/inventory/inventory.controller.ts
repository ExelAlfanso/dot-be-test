import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RoleGuard } from '../auth/role/role.guard';
import { Roles } from '../auth/role/roles.decorator';
import { InventoryMovementResponseDto } from './dtos/inventory-response.dto';
import {
  ErrorResponseDto,
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
} from '../common/dtos/error-response.dto';
import { InventoryMovementDto } from './dtos/inventory.dto';
import { PaginatedInventoryMovementsResponseDto } from './dtos/paginated-inventory-response.dto';

@ApiTags('Inventory Movements')
@Controller('inventory-movements')
@UseGuards(JwtAuthGuard, RoleGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create inventory movement (ADMIN only)' })
  @ApiResponse({
    status: 201,
    description: 'Inventory movement created',
    type: InventoryMovementResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - ADMIN role required',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
    type: NotFoundResponseDto,
  })
  createMovement(@Body() dto: InventoryMovementDto, @Request() req) {
    return this.inventoryService.inventoryHandler(dto, req.user.userId);
  }

  @Get()
  @Roles('USER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List inventory movements with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number (starts from 1, defaults to 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Number of items per page (1-100, defaults to 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of inventory movements with metadata',
    type: PaginatedInventoryMovementsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Invalid role',
    type: ForbiddenResponseDto,
  })
  getAllMovements(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.getAllMovements(page, limit);
  }

  @Get('product/:productId')
  @Roles('USER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get product inventory movement history' })
  @ApiResponse({
    status: 200,
    description: 'Returns inventory movement history',
    type: [InventoryMovementResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
    type: NotFoundResponseDto,
  })
  getProductHistory(@Param('productId') productId: string) {
    return this.inventoryService.getProductInventoryHistory(productId);
  }
}
