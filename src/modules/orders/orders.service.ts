import { OrderStatus, PrismaClient } from '@prisma/client';
import { AppError, ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors';
import { JwtUser } from '../../plugins/jwt';

const orderInclude = {
  items: {
    include: {
      product: { select: { id: true, name: true, imageUrl: true } },
    },
  },
} as const;

export class OrdersService {
  constructor(private prisma: PrismaClient) {}

  async checkout(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError('The cart is empty.', 400);
    }

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new ConflictError(`Insufficient stock for product "${item.product.name}".`);
      }
    }

    const totalCents = cart.items.reduce(
      (sum, item) => sum + item.product.priceCents * item.quantity,
      0,
    );

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          totalCents,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPriceCents: item.product.priceCents,
            })),
          },
        },
        include: orderInclude,
      });

      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return createdOrder;
    });

    return order;
  }

  async listForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAll() {
    return this.prisma.order.findMany({
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string, requester: JwtUser) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: orderInclude });
    if (!order) {
      throw new NotFoundError('Order not found.');
    }
    if (requester.role !== 'ADMIN' && order.userId !== requester.id) {
      throw new ForbiddenError('You do not have access to this order.');
    }
    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundError('Order not found.');
    }
    return this.prisma.order.update({ where: { id }, data: { status }, include: orderInclude });
  }
}
