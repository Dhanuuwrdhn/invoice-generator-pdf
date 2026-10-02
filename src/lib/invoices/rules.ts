// One token buys a new invoice; after that every sixth saved edit costs one more.
export function isPaidEdit(editCount: number): boolean {
  return editCount > 0 && editCount % 6 === 0;
}

export function nextPaidEdit(editCount: number): number {
  return (Math.floor(editCount / 6) + 1) * 6;
}
