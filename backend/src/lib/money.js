// All money is stored as integer kobo (1 NGN = 100 kobo) to avoid float errors.
export const CURRENCY = 'NGN';
export const isKobo = (n) => Number.isInteger(n) && n >= 0;

export function lineTotal(unitPrice, qty) {
  return unitPrice * qty;
}

export function computeTotals(items, { deliveryFee = 0, discount } = {}) {
  const subtotal = items.reduce((s, i) => s + lineTotal(i.unitPrice, i.qty), 0);
  let discountAmount = 0;
  if (discount && discount.value > 0) {
    discountAmount = discount.type === 'percent'
      ? Math.round((subtotal * Math.min(discount.value, 100)) / 100)
      : Math.round(discount.value);
    discountAmount = Math.min(discountAmount, subtotal);
  }
  return { subtotal, discountAmount, deliveryFee, total: subtotal - discountAmount + deliveryFee };
}
