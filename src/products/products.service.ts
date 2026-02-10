import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, userId: string) {
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        createdBy: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(page = 1, limit = 10) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (safePage - 1) * safeLimit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        skip,
        take: safeLimit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.product.count(),
    ]);

    return {
      data: items,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(
    id: string,
    userId: string,
    userRole: string,
    updateProductDto: UpdateProductDto,
  ) {
    const product = await this.findOne(id);
    if (userRole !== 'ADMIN' && product.createdBy !== userId) {
      throw new ForbiddenException('You can only update your own products');
    }
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }
  async remove(id: string, userId: string, userRole: string) {
    const product = await this.findOne(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (userRole !== 'ADMIN' && product.createdBy !== userId) {
      throw new ForbiddenException('You can only delete your own products');
    }
    const inventoryCount = await this.prisma.inventoryMovement.count({
      where: { productId: id },
    });

    if (inventoryCount > 0) {
      throw new BadRequestException(
        `Cannot delete product with existing inventory movements. Found ${inventoryCount} movement(s).`,
      );
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
