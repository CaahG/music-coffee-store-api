import type { APIRequestContext, APIResponse } from '@playwright/test';

export type ApiResponse<T = any> = {
  status: number;
  body: T;
};

/*
 * "Page Object" base para a suíte de testes de API em Playwright. Diferente
 * da versão Vitest (que usa o inject() do Fastify em memória, sem rede),
 * aqui cada chamada é uma requisição HTTP real contra o servidor iniciado
 * pelo webServer do playwright.config.ts, via APIRequestContext.
 */
export abstract class BaseApi {
  constructor(protected readonly request: APIRequestContext) {}

  protected async get<T = any>(
    url: string,
    headers?: Record<string, string>,
    params?: Record<string, string | number | boolean>,
  ): Promise<ApiResponse<T>> {
    return this.toApiResponse<T>(await this.request.get(url, { headers, params }));
  }

  protected async post<T = any>(
    url: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.toApiResponse<T>(await this.request.post(url, { data, headers }));
  }

  protected async patch<T = any>(
    url: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.toApiResponse<T>(await this.request.patch(url, { data, headers }));
  }

  protected async delete<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.toApiResponse<T>(await this.request.delete(url, { headers }));
  }

  protected authHeader(token?: string): Record<string, string> | undefined {
    return token ? { authorization: `Bearer ${token}` } : undefined;
  }

  private async toApiResponse<T>(response: APIResponse): Promise<ApiResponse<T>> {
    const status = response.status();
    let body: any;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    return { status, body: body as T };
  }
}
