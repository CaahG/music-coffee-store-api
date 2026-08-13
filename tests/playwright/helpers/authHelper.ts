import { AuthApi } from '../pom/authAPI';
import { adminCredentials, buildCustomerPayload } from '../../fixtures/users';

export async function getAdminToken(authApi: AuthApi): Promise<string> {
  const response = await authApi.login(adminCredentials);
  if (response.status !== 200) {
    throw new Error(`Failed to authenticate as admin: ${JSON.stringify(response.body)}`);
  }
  return response.body.token as string;
}

export async function registerAndLoginCustomer(authApi: AuthApi) {
  const credentials = buildCustomerPayload();
  const response = await authApi.register(credentials);
  if (response.status !== 201) {
    throw new Error(`Failed to register test customer: ${JSON.stringify(response.body)}`);
  }
  return {
    token: response.body.token as string,
    user: response.body.user as { id: string; name: string; email: string; role: string },
    credentials,
  };
}
