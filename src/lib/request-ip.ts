// Caddy appends the real client address as the last X-Forwarded-For entry;
// anything before it is client-controlled.
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const last = forwarded?.split(',').pop()?.trim();
  return last || headers.get('x-real-ip') || 'unknown';
}
