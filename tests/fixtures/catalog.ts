import { randomUUID } from 'node:crypto';

export function buildCategoryPayload(overrides: Partial<{ name: string }> = {}) {
  return {
    name: `QA Category ${randomUUID()}`,
    ...overrides,
  };
}

export function buildProductPayload(
  categoryId: string,
  overrides: Partial<{
    name: string;
    description: string;
    priceCents: number;
    stock: number;
    categoryId: string;
  }> = {},
) {
  return {
    name: `QA Test Product ${randomUUID()}`,
    description: 'Product created by the automated test suite.',
    priceCents: 1000,
    stock: 10,
    categoryId,
    ...overrides,
  };
}
