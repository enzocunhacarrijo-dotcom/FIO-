import { scanResultSchema, type ScanResult } from '@hair-analysis/shared';
import { ApiError } from './client';

function getBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) throw new ApiError('EXPO_PUBLIC_API_URL não está configurado.', 0, 'missing_api_url');
  return url;
}

export async function scanProduct(accessToken: string, photo: { uri: string }): Promise<ScanResult> {
  const form = new FormData();
  // Expo's SDK 57+ global `fetch` follows the WinterCG/web spec: FormData file
  // parts must be a real Blob, not React Native's legacy { uri, name, type }
  // shorthand (that shape now throws "Unsupported FormDataPart implementation").
  // Fetching a local file:// URI doesn't reliably set Blob.type, so we force
  // it explicitly — the capture screen always saves this photo as JPEG.
  const rawBlob = await (await fetch(photo.uri)).blob();
  const blob = rawBlob.type === 'image/jpeg' ? rawBlob : new Blob([rawBlob], { type: 'image/jpeg' });
  form.append('file', blob, 'label.jpg');

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
