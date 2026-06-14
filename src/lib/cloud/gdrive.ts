/**
 * Google Drive backup provider. Uses Google Identity Services (GIS) for an OAuth token with
 * the narrow `drive.file` scope, then uploads via the Drive REST API — all client-side, with
 * the user's own OAuth client ID. No app server is involved.
 */

interface TokenResponse {
  access_token?: string;
  error?: string;
}
interface TokenClient {
  requestAccessToken: (opts: { prompt: '' | 'consent' }) => void;
}
interface GisGlobal {
  accounts: {
    oauth2: {
      initTokenClient: (cfg: {
        client_id: string;
        scope: string;
        callback: (r: TokenResponse) => void;
        error_callback?: (e: { type?: string; message?: string }) => void;
      }) => TokenClient;
    };
  };
}

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
let gisLoad: Promise<void> | null = null;

function gis(): GisGlobal | undefined {
  return (window as unknown as { google?: GisGlobal }).google;
}

function loadGis(): Promise<void> {
  if (gis()) return Promise.resolve();
  if (gisLoad) return gisLoad;
  gisLoad = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load Google sign-in.'));
    document.head.appendChild(s);
  });
  return gisLoad;
}

async function getToken(clientId: string, interactive: boolean): Promise<string> {
  await loadGis();
  const g = gis();
  if (!g) throw new Error('Google sign-in unavailable.');
  return new Promise<string>((resolve, reject) => {
    const client = g.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (r) => (r.access_token ? resolve(r.access_token) : reject(new Error(r.error || 'Authorization failed.'))),
      error_callback: (e) => reject(new Error(e.message || 'Authorization was cancelled.')),
    });
    // Silent ('') for auto-backup once consented; interactive ('consent') for manual.
    client.requestAccessToken({ prompt: interactive ? 'consent' : '' });
  });
}

/** Upload a backup file to Drive (multipart). drive.file scope can create app files. */
export async function gdriveBackup(
  clientId: string,
  blob: Blob,
  filename: string,
  interactive: boolean,
): Promise<void> {
  if (!clientId.trim()) throw new Error('Add your Google OAuth Client ID in Settings first.');
  const token = await getToken(clientId.trim(), interactive);
  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify({ name: filename, mimeType: 'application/json' })], { type: 'application/json' }),
  );
  form.append('file', blob);
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Drive upload failed (${res.status}).`);
}
