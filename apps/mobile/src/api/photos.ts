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

  // Expo's SDK 57+ global `fetch` follows the WinterCG/web spec: FormData file
  // parts must be a real Blob, not React Native's legacy { uri, name, type }
  // shorthand (that shape now throws "Unsupported FormDataPart implementation").
  // Fetching a local file:// URI doesn't reliably set Blob.type, so we force
  // it explicitly — prepareForUpload always saves the photo as JPEG.
  const rawBlob = await (await fetch(photo.uri)).blob();
  const blob = rawBlob.type === 'image/jpeg' ? rawBlob : new Blob([rawBlob], { type: 'image/jpeg' });
  form.append('file', blob, `${kind}.jpg`);

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/api/photos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new ApiError(`Não foi possível enviar a foto. Verifique sua conexão. (${detail})`, 0, 'network_error');
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

export async function getPhotoHistory(accessToken: string, kind?: PhotoKind): Promise<PhotoRecord[]> {
  const query = kind ? `?kind=${kind}` : '';
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/api/photos/history${query}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor.', 0, 'network_error');
  }
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError('Não foi possível carregar o histórico de fotos.', response.status, 'fetch_error');
  return (json as unknown[]).map((item) => photoRecordSchema.parse(item));
}
