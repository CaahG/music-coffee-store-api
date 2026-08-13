import { randomUUID } from 'node:crypto';

export const adminCredentials = {
  email: 'admin@musicandcoffee.com',
  password: 'admin123',
};

export function buildCustomerPayload(overrides: Partial<{ name: string; email: string; password: string }> = {}) {
  return {
    name: 'QA Test Customer',
    email: `qa-customer-${randomUUID()}@example.com`,
    password: 'customer123',
    ...overrides,
  };
}
