import { Prisma, PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../lib/errors';
import { ProductCreateBody, ProductQuery, ProductUpdateBody } from './products.schemas';

export class ProductsService {
  constructor(private prisma: PrismaClient) {}

  async list(query: ProductQuery) {
    const where: Prisma.ProductWhereInput = {};

    if (query.category) {
      where.category = { slug: query.category };
    }

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, page: query.page, limit: query.limit, total };
  }

  async getById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundError('Product not found.');
    }
    return product;
  }

  async create(data: ProductCreateBody) {
    await this.ensureCategoryExists(data.categoryId);
    return this.prisma.product.create({
      data,
      include: { category: true },
    });
  }

  async update(id: string, data: ProductUpdateBody) {
    await this.getById(id);
    if (data.categoryId) {
      await this.ensureCategoryExists(data.categoryId);
    }
    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.getById(id);
    await this.prisma.product.delete({ where: { id } });
  }

  private async ensureCategoryExists(categoryId: string) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundError('The specified category does not exist.');
    }
  }
}
