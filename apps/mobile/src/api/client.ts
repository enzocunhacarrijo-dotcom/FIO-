export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) {
    throw new ApiError('EXPO_PUBLIC_API_URL não está configurado.', 0, 'missing_api_url');
  }
  return url;
}

export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; accessToken?: string } = {},
): Promise<T> {
  const { method = 'GET', body, accessToken } = options;

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua conexão.', 0, 'network_error');
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message = (json && typeof json === 'object' && 'message' in json && typeof json.message === 'string')
      ? json.message
      : 'Algo deu errado. Tente novamente.';
    const code = (json && typeof json === 'object' && 'error' in json && typeof json.error === 'string')
      ? json.error
      : 'unknown_error';
    throw new ApiError(message, response.status, code);
  }

  return json as T;
}
