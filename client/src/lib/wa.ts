import type { CartItem } from '../context/CartContext';

export const waLink = (phone: string, message: string) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

/** Formatea un monto: "S/ 120" o "S/ 119.90". */
function money(amount: number, symbol: string): string {
  const hasDecimals = Math.round(amount * 100) % 100 !== 0;
  return `${symbol} ${hasDecimals ? amount.toFixed(2) : Math.round(amount)}`;
}

/**
 * Arma el mensaje de WhatsApp para un carrito.
 * Incluye cantidades, precio por línea, total estimado y los enlaces.
 */
export function buildCartMessage(
  items: CartItem[],
  opts: { currency: string; siteUrl?: string }
): string {
  const { currency } = opts;
  const siteUrl = (opts.siteUrl || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');

  const lines: string[] = ['Hola! Me interesan estos productos:', ''];

  let total = 0;
  let hasUnpriced = false;

  for (const it of items) {
    const unit =
      it.sale_price != null && it.price != null && it.sale_price < it.price
        ? it.sale_price
        : it.price ?? null;

    const qtyLabel = it.qty > 1 ? ` (x${it.qty})` : '';

    if (unit == null) {
      hasUnpriced = true;
      lines.push(`• ${it.name}${qtyLabel} — a consultar`);
    } else {
      const lineTotal = unit * it.qty;
      total += lineTotal;
      const onSale = it.sale_price != null && it.price != null && it.sale_price < it.price;
      const priceStr = onSale
        ? `${money(lineTotal, currency)} (oferta, antes ${money(it.price! * it.qty, currency)})`
        : money(lineTotal, currency);
      lines.push(`• ${it.name}${qtyLabel} — ${priceStr}`);
    }
  }

  lines.push('');
  if (total > 0) {
    lines.push(`Total${hasUnpriced ? ' parcial' : ''} aprox: ${money(total, currency)}`);
    if (hasUnpriced) lines.push('(hay productos por cotizar)');
  } else {
    lines.push('Quedo atenta/o a la cotización.');
  }

  if (siteUrl) {
    lines.push('', 'Enlaces:');
    for (const it of items) {
      lines.push(`${siteUrl}/producto/${it.slug}`);
    }
  }

  return lines.join('\n');
}
