import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const MAX_LOGO_BYTES = 500 * 1024;

export class InvalidLogoError extends Error {}

const uploadDir = () => process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');
const REL_PATH_RE = /^[0-9a-f-]{36}\/logo-[0-9a-f-]{36}\.(png|jpg)$/;

export function detectImageFormat(buf: Buffer): 'png' | 'jpg' | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  return null;
}

// Every upload gets a new file name so invoices keep the logo they were made with.
// ponytail: old logo files are never deleted; add cleanup if uploads/ grows noticeably.
export async function saveLogo(userId: string, buf: Buffer): Promise<string> {
  if (buf.length > MAX_LOGO_BYTES) throw new InvalidLogoError('Logo must be 500 KB or smaller.');
  const format = detectImageFormat(buf);
  if (!format) throw new InvalidLogoError('Logo must be a PNG or JPEG image.');
  const relPath = `${userId}/logo-${randomUUID()}.${format}`;
  await fs.mkdir(path.join(uploadDir(), userId), { recursive: true });
  await fs.writeFile(path.join(uploadDir(), relPath), buf);
  return relPath;
}

export async function readLogo(relPath: string | null): Promise<{ data: Buffer; format: 'png' | 'jpg' } | null> {
  if (!relPath || !REL_PATH_RE.test(relPath)) return null;
  try {
    const data = await fs.readFile(path.join(uploadDir(), relPath));
    const format = detectImageFormat(data);
    return format ? { data, format } : null;
  } catch {
    return null;
  }
}
