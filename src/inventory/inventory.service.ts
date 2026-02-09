import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InventoryInDto } from './dtos/inventory-in.dto';
import { InventoryOutDto } from './dtos/inventory-out.dto';
import { InventoryMovementDto } from './dtos/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async addInventory(dto: InventoryInDto, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.createdBy !== userId) {
      throw new ForbiddenException(
        'You can only manage inventory for your own products',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const movement = await tx.inventoryMovement.create({
        data: {
          productId: dto.productId,
          type: 'IN',
          quantity: dto.quantity,
          reference: dto.reference,
          createdBy: userId,
        },
      });

      const updatedProduct = await tx.product.update({
        where: { id: dto.productId },
        data: { stock: { increment: dto.quantity } },
      });

      return { ...movement, product: updatedProduct };
    });
  }

  async removeInventory(dto: InventoryOutDto, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.createdBy !== userId) {
      throw new ForbiddenException(
        'You can only manage inventory for your own products',
      );
    }
    if (product.stock < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}, Requested: ${dto.quantity}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.product.updateMany({
        where: {
          id: dto.productId,
          stock: { gte: dto.quantity },
        },
        data: { stock: { decrement: dto.quantity } },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${product.stock}, Requested: ${dto.quantity}`,
        );
      }

      const movement = await tx.inventoryMovement.create({
        data: {
          productId: dto.productId,
          type: 'OUT',
          quantity: dto.quantity,
          reference: dto.reference,
          createdBy: userId,
        },
      });

      const updatedProduct = await tx.product.findUnique({
        where: { id: dto.productId },
      });

      return { ...movement, product: updatedProduct };
    });
  }
  async adjustInventory(dto: InventoryOutDto, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const newStock = product.stock + dto.quantity;
    if (newStock < 0) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}, Requested adjustment: ${dto.quantity}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const movement = await tx.inventoryMovement.create({
        data: {
          productId: dto.productId,
          type: 'ADJUSTMENT',
          quantity: dto.quantity,
          reference: dto.reference,
          createdBy: userId,
        },
      });

      const updatedProduct = await tx.product.update({
        where: { id: dto.productId },
        data: { stock: newStock },
      });

      return { ...movement, product: updatedProduct };
    });
  }

  async inventoryHandler(dto: InventoryMovementDto, userId: string) {
    if (dto.type === 'IN') {
      return this.addInventory(dto, userId);
    }
    if (dto.type === 'OUT') {
      return this.removeInventory(dto, userId);
    }
    if (dto.type === 'ADJUSTMENT') {
      return this.adjustInventory(dto, userId);
    }

    throw new BadRequestException('Invalid inventory movement type');
  }

  async getAllMovements() {
    return this.prisma.inventoryMovement.findMany({
      orderBy: { createdAt: 'desc' },
      include: { product: true },
    });
  }

  async getProductInventoryHistory(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.inventoryMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: { product: true },
    });
  }
}
