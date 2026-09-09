import type { CartItem } from '../context/CartContext';

export const waLink = (phone: string, message: string) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

/** Formatea un monto: "S/ 120" o "S/ 119.90". */
function money(amount: number, symbol: string): string {
  const hasDecimals = Math.round(amount * 100) % 100 !== 0;
  return `${symbol} ${hasDecimals ? amount.toFixed(2) : Math.round(amount)}`;
}

/** Precio efectivo de un item (sale_price si hay oferta válida, si no price). */
function unitPrice(it: CartItem): number | null {
  if (it.sale_price != null && it.price != null && it.sale_price < it.price) return it.sale_price;
  return it.price ?? null;
}

/**
 * Mensaje de WhatsApp para un carrito.
 * Lista numerada con Nombre, cantidad (x1, x2...), precio y URL de cada producto.
 */
export function buildCartMessage(
  items: CartItem[],
  opts: { currency: string; customerName?: string; siteUrl?: string }
): string {
  const { currency, customerName } = opts;
  const siteUrl = (
    opts.siteUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  ).replace(/\/$/, '');

  const saludo = customerName
    ? `Hola! Soy *${customerName.trim()}*, me interesan estos productos:`
    : 'Hola! Me interesan estos productos:';

  const lines: string[] = [saludo, '', '*Mi selección*'];

  let total = 0;
  let hasUnpriced = false;

  items.forEach((it, idx) => {
    const unit = unitPrice(it);
    const n = idx + 1;
    const url = siteUrl ? `${siteUrl}/producto/${it.slug}` : '';

    if (unit == null) {
      hasUnpriced = true;
      lines.push(`${n}. *${it.name}* — x${it.qty} — _precio a consultar_`);
    } else {
      const lineTotal = unit * it.qty;
      total += lineTotal;
      const onSale = it.sale_price != null && it.price != null && it.sale_price < it.price;
      const priceStr = onSale
        ? `${money(lineTotal, currency)} _(oferta, antes ~${money(it.price! * it.qty, currency)}~)_`
        : money(lineTotal, currency);
      lines.push(`${n}. *${it.name}* — x${it.qty} — ${priceStr}`);
    }
    if (url) lines.push(`   ${url}`);
  });

  lines.push('');
  if (total > 0) {
    lines.push(`*Total${hasUnpriced ? ' parcial' : ''}: ${money(total, currency)}*`);
    if (hasUnpriced) lines.push('_(hay productos por cotizar)_');
  }
  lines.push('', 'Quedo atenta/o para realizar mi pedido.');

  return lines.join('\n');
}
