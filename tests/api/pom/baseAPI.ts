import type { FastifyInstance } from 'fastify';
import type { InjectOptions } from 'light-my-request';

export type ApiResponse<T = any> = {
  status: number;
  body: T;
};

/*
 * "Page Object" base para a suíte de testes de API. Em um POM de navegador,
 * isso pilotaria uma página através de uma sessão WebDriver; aqui, pilota um
 * endpoint através do `inject()` do Fastify (sem precisar de rede/porta real).
 * As classes de cada recurso nesta pasta (AuthApi, CartApi, OrderApi, ...)
 * estendem esta classe da mesma forma que páginas estendem uma BasePage em
 * automação de UI.
 */
export abstract class BaseApi {
  constructor(protected readonly app: FastifyInstance) {}

  protected async request<T = any>(options: InjectOptions): Promise<ApiResponse<T>> {
    const response = await this.app.inject(options);
    return {
      status: response.statusCode,
      body: this.parseBody(response.payload),
    };
  }

  protected authHeader(token?: string): Record<string, string> | undefined {
    return token ? { authorization: `Bearer ${token}` } : undefined;
  }

  private parseBody(payload: string): any {
    if (!payload) {
      return undefined;
    }
    try {
      return JSON.parse(payload);
    } catch {
      return payload;
    }
  }
}
