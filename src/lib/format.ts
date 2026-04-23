export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(Math.round(amount));
}

export function calcSubtotal(items: { qty: number; price: number }[]): number {
  return items.reduce((sum, item) => sum + item.qty * item.price, 0);
}

export function calcTax(subtotal: number, discount: number, taxRate: number): number {
  return Math.round((subtotal - discount) * (taxRate / 100));
}

export function calcTotal(subtotal: number, discount: number, taxAmt: number): number {
  return subtotal - discount + taxAmt;
}
