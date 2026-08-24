import { Platform } from 'react-native';
import { photoRecordSchema, type PhotoKind, type PhotoRecord } from '@hair-analysis/shared';
import { ApiError } from './client';

function getBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) throw new ApiError('EXPO_PUBLIC_API_URL não está configurado.', 0, 'missing_api_url');
  return url;
}

export async function uploadPhoto(
  accessToken: string,
  kind: PhotoKind,
  photo: { uri: string; width: number; height: number },
): Promise<PhotoRecord> {
  const form = new FormData();
  form.append('kind', kind);
  form.append('width', String(Math.round(photo.width)));
  form.append('height', String(Math.round(photo.height)));

  // React Native's fetch understands the { uri, name, type } file descriptor
  // natively, but react-native-web's FormData does not — it needs a real Blob.
  if (Platform.OS === 'web') {
    const blob = await (await fetch(photo.uri)).blob();
    form.append('file', blob, `${kind}.jpg`);
  } else {
    form.append('file', {
      uri: photo.uri,
      name: `${kind}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);
  }

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/api/photos`, {
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
        : 'Não foi possível enviar a foto.';
    throw new ApiError(message, response.status, 'upload_error');
  }

  return photoRecordSchema.parse(json);
}

export async function getLatestPhotos(accessToken: string): Promise<PhotoRecord[]> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/api/photos/latest`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor.', 0, 'network_error');
  }
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError('Não foi possível carregar as fotos.', response.status, 'fetch_error');
  return (json as unknown[]).map((item) => photoRecordSchema.parse(item));
}
