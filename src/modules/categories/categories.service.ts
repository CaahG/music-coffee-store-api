import { PrismaClient } from '@prisma/client';
import { ConflictError, NotFoundError } from '../../lib/errors';
import { CategoryCreateBody, CategoryUpdateBody, slugify } from './categories.schemas';

export class CategoriesService {
  constructor(private prisma: PrismaClient) {}

  list() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async getById(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundError('Category not found.');
    }
    return category;
  }

  async create(data: CategoryCreateBody) {
    const slug = slugify(data.name);
    const existing = await this.prisma.category.findFirst({
      where: { OR: [{ name: data.name }, { slug }] },
    });
    if (existing) {
      throw new ConflictError('A category with this name already exists.');
    }
    return this.prisma.category.create({ data: { name: data.name, slug } });
  }

  async update(id: string, data: CategoryUpdateBody) {
    await this.getById(id);

    if (data.name) {
      const slug = slugify(data.name);
      const existing = await this.prisma.category.findFirst({
        where: { OR: [{ name: data.name }, { slug }], NOT: { id } },
      });
      if (existing) {
        throw new ConflictError('A category with this name already exists.');
      }
      return this.prisma.category.update({ where: { id }, data: { name: data.name, slug } });
    }

    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.getById(id);
    await this.prisma.category.delete({ where: { id } });
  }
}
