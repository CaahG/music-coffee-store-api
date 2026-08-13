import { BaseApi } from './baseAPI';
import { endpoints } from '../../selectors/endpoints';

export class AuthApi extends BaseApi {
  register(payload: Record<string, unknown>) {
    return this.request({ method: 'POST', url: endpoints.auth.register, payload });
  }

  login(payload: Record<string, unknown>) {
    return this.request({ method: 'POST', url: endpoints.auth.login, payload });
  }
}
