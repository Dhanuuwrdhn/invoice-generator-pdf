import { getCurrentUser } from '@/lib/auth/current-user';
import { readLogo } from '@/lib/logo';
import { getSettings } from '@/lib/settings';

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.emailVerifiedAt) return new Response('Unauthorized', { status: 401 });
  const logo = await readLogo((await getSettings(user.id)).logoPath);
  if (!logo) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(logo.data), {
    headers: {
      'Content-Type': logo.format === 'png' ? 'image/png' : 'image/jpeg',
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  });
}
