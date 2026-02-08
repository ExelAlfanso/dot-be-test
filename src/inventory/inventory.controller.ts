import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RoleGuard } from 'src/auth/role/role.guard';
import { Roles } from 'src/auth/role/roles.decorator';
import { InventoryMovementResponseDto } from './dtos/inventory-response.dto';
import {
  ErrorResponseDto,
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
} from 'src/common/dtos/error-response.dto';
import { InventoryMovementDto } from './dtos/inventory.dto';
import { InventoryInDto } from './dtos/inventory-in.dto';
import { InventoryOutDto } from './dtos/inventory-out.dto';

@ApiTags('inventory-movements')
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

  @Post('in')
  @Roles('USER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add inventory (stock in)' })
  @ApiResponse({
    status: 201,
    description: 'Inventory added successfully',
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
    description:
      'Forbidden - You can only manage inventory for your own products',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
    type: NotFoundResponseDto,
  })
  addInventory(@Body() dto: InventoryInDto, @Request() req) {
    return this.inventoryService.addInventory(dto, req.user.userId);
  }

  @Post('out')
  @Roles('USER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove inventory (stock out)' })
  @ApiResponse({
    status: 201,
    description: 'Inventory removed successfully',
    type: InventoryMovementResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Insufficient stock or invalid data',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - You can only manage inventory for your own products',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
    type: NotFoundResponseDto,
  })
  removeInventory(@Body() dto: InventoryOutDto, @Request() req) {
    return this.inventoryService.removeInventory(dto, req.user.userId);
  }

  @Get()
  @Roles('USER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List inventory movements' })
  @ApiResponse({
    status: 200,
    description: 'Returns inventory movements',
    type: [InventoryMovementResponseDto],
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
  getAllMovements() {
    return this.inventoryService.getAllMovements();
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
