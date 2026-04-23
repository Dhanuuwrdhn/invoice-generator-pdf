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

export function numberToWords(n: number): string {
  if (n === 0) return 'Nol Rupiah';

  const billion = Math.floor(n / 1_000_000_000);
  const million = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousand = Math.floor((n % 1_000_000) / 1_000);
  const remainder = n % 1_000;

  let result = '';
  if (billion) result += `${convertGroup(billion)} Miliar `;
  if (million) result += `${convertGroup(million)} Juta `;
  if (thousand) result += thousand === 1 ? 'Seribu ' : `${convertGroup(thousand)} Ribu `;
  if (remainder) result += convertGroup(remainder);

  return result.trim() + ' Rupiah';
}
