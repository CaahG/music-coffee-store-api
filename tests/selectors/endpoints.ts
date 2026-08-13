/*
 * Dicionário de "seletores" reutilizável para a suíte de testes de API: uma
 * única fonte de verdade para o caminho de cada rota, usada por todos os
 * Page Objects. Manter os caminhos aqui (em vez de strings fixas nos specs)
 * significa que renomear uma rota só precisa ser atualizado em um lugar.
 */
export const endpoints = {
  health: '/health',
  docs: '/docs',

  auth: {
    register: '/auth/register',
    login: '/auth/login',
  },

  users: {
    me: '/users/me',
  },

  categories: {
    list: '/categories',
    byId: (id: string) => `/categories/${id}`,
  },

  products: {
    list: '/products',
    byId: (id: string) => `/products/${id}`,
  },

  cart: {
    root: '/cart',
    items: '/cart/items',
    item: (productId: string) => `/cart/items/${productId}`,
  },

  orders: {
    root: '/orders',
    byId: (id: string) => `/orders/${id}`,
    status: (id: string) => `/orders/${id}/status`,
  },
} as const;
