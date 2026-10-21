import { Product, StockMovement } from '../models/index.js';
import { conflict } from '../lib/errors.js';

/*
 * INVENTORY RULES (single source of truth: Product.stock and Product.reserved)
 *   available = stock - reserved
 *   Online order created (unpaid) ....... reserved += qty   (only if available >= qty)
 *   Online payment verified ............. stock -= qty, reserved -= qty   (reservation becomes a deduction)
 *   Order unpaid/failed/expired/cancelled  reserved -= qty                  (reservation released)
 *   POS cash/offline-confirmed sale ..... stock -= qty directly (only if available >= qty)
 *   POS electronic sale ................. reserve first, then commit when payment is verified
 *   Cancel/return of a paid sale ........ stock += qty ONLY when the actor confirms "restock"
 * Every update is a single conditional atomic update, so concurrent requests cannot oversell.
 */
const tracked = (items) => items.filter((i) => i.track !== false);
const insufficient = (item) => conflict(`Not enough stock for "${item.name}"`, 'INSUFFICIENT_STOCK');

async function move({ business, item, type, stockDelta = 0, reservedDelta = 0, reason, actor, ref, session }) {
  const p = await Product.findById(item.product).session(session || null).select('stock');
  await StockMovement.create([{ business, product: item.product, type, stockDelta, reservedDelta, stockAfter: p?.stock, reason, actor, ref }], { session });
}

export async function reserve({ business, items, actor, ref, session }) {
  for (const it of tracked(items)) {
    const r = await Product.updateOne(
      { _id: it.product, business, $expr: { $gte: [{ $subtract: ['$stock', '$reserved'] }, it.qty] } },
      { $inc: { reserved: it.qty } }, { session },
    );
    if (r.modifiedCount !== 1) throw insufficient(it);
    await move({ business, item: it, type: 'reserve', reservedDelta: it.qty, actor, ref, session });
  }
}

export async function release({ business, items, actor, ref, reason, session }) {
  for (const it of tracked(items)) {
    const r = await Product.updateOne({ _id: it.product, business, reserved: { $gte: it.qty } }, { $inc: { reserved: -it.qty } }, { session });
    if (r.modifiedCount !== 1) throw conflict(`Reservation mismatch for "${it.name}"`, 'RESERVATION_MISMATCH');
    await move({ business, item: it, type: 'release', reservedDelta: -it.qty, reason, actor, ref, session });
  }
}

// Reservation -> deduction. Caller must have atomically claimed the document's stockState first.
export async function commit({ business, items, type, actor, ref, session }) {
  for (const it of tracked(items)) {
    const r = await Product.updateOne(
      { _id: it.product, business, stock: { $gte: it.qty }, reserved: { $gte: it.qty } },
      { $inc: { stock: -it.qty, reserved: -it.qty } }, { session },
    );
    if (r.modifiedCount !== 1) throw conflict(`Stock mismatch for "${it.name}"`, 'STOCK_MISMATCH');
    await move({ business, item: it, type, stockDelta: -it.qty, reservedDelta: -it.qty, actor, ref, session });
  }
}

// Direct deduction with no prior reservation (cash POS sale, or a late payment after a reservation expired).
export async function deduct({ business, items, type, actor, ref, session }) {
  for (const it of tracked(items)) {
    const r = await Product.updateOne(
      { _id: it.product, business, $expr: { $gte: [{ $subtract: ['$stock', '$reserved'] }, it.qty] } },
      { $inc: { stock: -it.qty } }, { session },
    );
    if (r.modifiedCount !== 1) throw insufficient(it);
    await move({ business, item: it, type, stockDelta: -it.qty, actor, ref, session });
  }
}

export async function restock({ business, items, type, actor, ref, reason, session }) {
  for (const it of tracked(items)) {
    await Product.updateOne({ _id: it.product, business }, { $inc: { stock: it.qty } }, { session });
    await move({ business, item: it, type, stockDelta: it.qty, reason, actor, ref, session });
  }
}

export async function adjust({ business, productId, delta, reason, actor, type = 'adjustment', ref, session }) {
  const filter = { _id: productId, business, trackStock: true };
  if (delta < 0) filter.$expr = { $gte: [{ $subtract: ['$stock', '$reserved'] }, -delta] };
  const r = await Product.updateOne(filter, { $inc: { stock: delta } }, { session });
  if (r.modifiedCount !== 1) throw conflict('Adjustment would take available stock below zero, or the product does not track stock', 'ADJUST_REJECTED');
  await move({ business, item: { product: productId }, type, stockDelta: delta, reason, actor, ref, session });
}
