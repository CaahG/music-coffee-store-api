import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../lib/errors';

const cartInclude = {
  items: {
    include: { product: true },
  },
} as const;

function formatCart(cart: {
  id: string;
  items: { productId: string; quantity: number; product: { id: string; name: string; priceCents: number; imageUrl: string | null; stock: number } }[];
}) {
  const items = cart.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    product: item.product,
    subtotalCents: item.product.priceCents * item.quantity,
  }));

  return {
    id: cart.id,
    items,
    totalCents: items.reduce((sum, item) => sum + item.subtotalCents, 0),
  };
}

export class CartService {
  constructor(private prisma: PrismaClient) {}

  private async getOrCreateCart(userId: string) {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: cartInclude,
    });
    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    return formatCart(cart);
  }

  async addItem(userId: string, productId: string, quantity: number) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundError('Product not found.');
    }

    const cart = await this.getOrCreateCart(userId);

    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: { increment: quantity } },
      create: { cartId: cart.id, productId, quantity },
    });

    return this.getCart(userId);
  }

  async updateItem(userId: string, productId: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.productId === productId);
    if (!item) {
      throw new NotFoundError('Item not found in the cart.');
    }

    await this.prisma.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.productId === productId);
    if (!item) {
      throw new NotFoundError('Item not found in the cart.');
    }

    await this.prisma.cartItem.delete({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    return this.getCart(userId);
  }

  async clear(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getCart(userId);
  }
}
