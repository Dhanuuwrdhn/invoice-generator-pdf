import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);

const N = 32768;
const R = 8;
const P = 1;
const KEY_LEN = 64;
// N=2^15 with r=8 needs 32 MiB, which is exactly Node's default maxmem.
const MAX_MEM = 64 * 1024 * 1024;

/**
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = /** @type {Buffer} */ (await scrypt(password, salt, KEY_LEN, { N, r: R, p: P, maxmem: MAX_MEM }));
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

/**
 * @param {string} password
 * @param {string} stored
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, stored) {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, 'base64');
  if (expected.length === 0) return false;
  try {
    const key = /** @type {Buffer} */ (
      await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length, {
        N: Number(n),
        r: Number(r),
        p: Number(p),
        maxmem: MAX_MEM,
      })
    );
    return timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}
