import { Platform } from 'react-native';
import { scanResultSchema, type ScanResult } from '@hair-analysis/shared';
import { ApiError } from './client';

function getBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) throw new ApiError('EXPO_PUBLIC_API_URL não está configurado.', 0, 'missing_api_url');
  return url;
}

export async function scanProduct(accessToken: string, photo: { uri: string }): Promise<ScanResult> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(photo.uri)).blob();
    form.append('file', blob, 'label.jpg');
  } else {
    form.append('file', { uri: photo.uri, name: 'label.jpg', type: 'image/jpeg' } as unknown as Blob);
  }

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/api/scanner`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });
  } catch {
    throw new ApiError('Não foi possível enviar a foto. Verifique sua conexão.', 0, 'network_error');
  }

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      json && typeof json === 'object' && 'message' in json && typeof json.message === 'string'
        ? json.message
        : 'Não foi possível ler este produto.';
    throw new ApiError(message, response.status, 'scan_error');
  }
  return scanResultSchema.parse(json);
}
