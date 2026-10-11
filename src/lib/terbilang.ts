const ones = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan'];
const teens = ['Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas',
  'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'];

function convertGroup(n: number): string {
  if (n === 0) return '';
  if (n < 10) return ones[n];
  if (n < 20) return teens[n - 10];
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const rem = n % 10;
    return `${ones[ten]} Puluh${rem ? ' ' + ones[rem] : ''}`;
  }
  const hundred = Math.floor(n / 100);
  const rem = n % 100;
  const hundredStr = hundred === 1 ? 'Seratus' : `${ones[hundred]} Ratus`;
  return rem ? `${hundredStr} ${convertGroup(rem)}` : hundredStr;
}

// Short scale, one entry per group of three digits. The largest total the
// validation allows is 2e21 (100 items × qty 1e6 × price 1e13, 100% tax),
// so Sekstiliun covers it with room to spare.
const scales = ['', 'Ribu', 'Juta', 'Miliar', 'Triliun', 'Kuadriliun', 'Kuintiliun', 'Sekstiliun'];

// Totals are rounded to whole rupiah, matching formatCurrency. BigInt keeps the
// digits exact above Number.MAX_SAFE_INTEGER, so the words match the printed amount.
export function numberToWords(n: number): string {
  const rounded = Math.round(n);
  if (!(Math.abs(rounded) < 1e24)) throw new RangeError(`Cannot spell ${n}`);
  let rest = BigInt(Math.abs(rounded));
  if (rest === BigInt(0)) return 'Nol Rupiah';

  const words: string[] = [];
  for (const scale of scales) {
    const group = Number(rest % BigInt(1000));
    rest /= BigInt(1000);
    if (!group) continue;
    if (scale === 'Ribu' && group === 1) words.unshift('Seribu');
    else words.unshift(scale ? `${convertGroup(group)} ${scale}` : convertGroup(group));
  }

  return `${rounded < 0 ? 'Minus ' : ''}${words.join(' ')} Rupiah`;
}
