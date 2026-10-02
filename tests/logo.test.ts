import fs from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { detectImageFormat, InvalidLogoError, MAX_LOGO_BYTES, readLogo, saveLogo } from '@/lib/logo';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const USER = '11111111-1111-1111-1111-111111111111';

describe('logo storage', () => {
  beforeEach(async () => {
    await fs.rm(path.join('uploads', USER), { recursive: true, force: true });
  });

  it('detects formats from magic bytes', () => {
    expect(detectImageFormat(PNG)).toBe('png');
    expect(detectImageFormat(JPG)).toBe('jpg');
    expect(detectImageFormat(Buffer.from('<svg onload=alert(1)>'))).toBeNull();
  });

  it('rejects non-image bytes', async () => {
    await expect(saveLogo(USER, Buffer.from('<html></html>'))).rejects.toBeInstanceOf(InvalidLogoError);
  });

  it('rejects files over the size limit', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(MAX_LOGO_BYTES)]);
    await expect(saveLogo(USER, big)).rejects.toBeInstanceOf(InvalidLogoError);
  });

  it('old logo file survives replacement', async () => {
    const first = await saveLogo(USER, PNG);
    const second = await saveLogo(USER, JPG);
    expect(first).not.toBe(second);
    expect((await readLogo(first))?.format).toBe('png');
    expect((await readLogo(second))?.format).toBe('jpg');
    expect(second.startsWith(`${USER}/logo-`)).toBe(true);
  });

  it('refuses paths that were not produced by saveLogo', async () => {
    expect(await readLogo('../package.json')).toBeNull();
    expect(await readLogo(null)).toBeNull();
  });
});
