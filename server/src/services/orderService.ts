import pool from '../config/database';
import { sanitizeDiscount, computeSalePrice } from './productService';
import type {
  CreateOrderDTO,
  Order,
  OrderWithItems,
  OrderStatus,
  PaginatedResponse,
} from '../types/models';

// =============================================
// Normalizar filas (pg devuelve NUMERIC como string)
// =============================================
const rowToOrder = (r: any): Order => ({
  id: r.id,
  customer_name: r.customer_name,
  customer_phone: r.customer_phone,
  status: r.status,
  currency_symbol: r.currency_symbol,
  subtotal: r.subtotal != null ? parseFloat(r.subtotal) : 0,
  has_unpriced: r.has_unpriced,
  confirmed_at: r.confirmed_at,
  created_at: r.created_at,
  updated_at: r.updated_at,
});

const rowToItem = (r: any) => ({
  id: r.id,
  order_id: r.order_id,
  product_id: r.product_id,
  product_name: r.product_name,
  product_slug: r.product_slug,
  qty: r.qty,
  unit_price: r.unit_price != null ? parseFloat(r.unit_price) : null,
  line_total: r.line_total != null ? parseFloat(r.line_total) : null,
});

// =============================================
// CREAR PEDIDO (público). Estado inicial: pendiente.
// Los precios se toman de la BD (no del cliente) como snapshot.
// =============================================
export const createOrder = async (data: CreateOrderDTO): Promise<OrderWithItems> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Traer los productos referenciados para armar los snapshots
    const ids = data.items.map((i) => i.product_id);
    const prodRes = await client.query(
      `SELECT id, name, slug, price::float8 AS price, discount_percent, stock
       FROM products WHERE id = ANY($1)`,
      [ids]
    );
    const prodMap = new Map<number, any>(prodRes.rows.map((p: any) => [p.id, p]));

    // símbolo de moneda actual
    const curRes = await client.query(
      `SELECT value FROM settings WHERE key = 'currency_symbol'`
    );
    const currencySymbol = data.currency_symbol || curRes.rows[0]?.value || 'S/';

    let subtotal = 0;
    let hasUnpriced = false;
    const itemsToInsert: Array<{
      product_id: number | null;
      product_name: string;
      product_slug: string | null;
      qty: number;
      unit_price: number | null;
      line_total: number | null;
    }> = [];

    for (const it of data.items) {
      const p = prodMap.get(it.product_id);
      let qty = Math.max(1, Math.min(99, Math.floor(it.qty)));
      if (!p) {
        // producto no encontrado: se guarda igual con datos mínimos
        itemsToInsert.push({
          product_id: null,
          product_name: `Producto #${it.product_id}`,
          product_slug: null,
          qty,
          unit_price: null,
          line_total: null,
        });
        hasUnpriced = true;
        continue;
      }

      // Cap por stock real: nunca guardar un pedido con más cantidad que
      // el stock disponible en la BD (el cliente no es fuente de verdad).
      const stock = p.stock ?? 0;
      if (stock > 0 && qty > stock) qty = stock;

      const pct = sanitizeDiscount(p.discount_percent);
      const effective = computeSalePrice(p.price, pct) ?? p.price ?? null;
      const lineTotal = effective != null ? Math.round(effective * qty * 100) / 100 : null;
      if (effective == null) hasUnpriced = true;
      else subtotal += lineTotal!;

      itemsToInsert.push({
        product_id: p.id,
        product_name: p.name,
        product_slug: p.slug,
        qty,
        unit_price: effective,
        line_total: lineTotal,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    const orderRes = await client.query(
      `INSERT INTO orders (customer_name, customer_phone, currency_symbol, subtotal, has_unpriced)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.customer_name.trim().slice(0, 120),
        data.customer_phone ? data.customer_phone.replace(/\D/g, '').slice(0, 30) || null : null,
        currencySymbol,
        subtotal,
        hasUnpriced,
      ]
    );
    const order = orderRes.rows[0];

    for (const it of itemsToInsert) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_slug, qty, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order.id, it.product_id, it.product_name, it.product_slug, it.qty, it.unit_price, it.line_total]
      );
    }

    await client.query('COMMIT');

    const itemsRes = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY id',
      [order.id]
    );
    return { ...rowToOrder(order), items: itemsRes.rows.map(rowToItem) };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// =============================================
// LISTAR PEDIDOS (admin, paginado)
// =============================================
export const listOrders = async (opts: {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<OrderWithItems>> => {
  const page = Math.max(1, Math.floor(Number(opts.page) || 1));
  const limit = Math.min(100, Math.max(1, Math.floor(Number(opts.limit) || 20)));
  const offset = (page - 1) * limit;

  const where = opts.status ? 'WHERE status = $1' : '';
  const params: any[] = opts.status ? [opts.status] : [];

  const countRes = await pool.query(`SELECT COUNT(*) FROM orders ${where}`, params);
  const total = parseInt(countRes.rows[0].count);

  const ordersRes = await pool.query(
    `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  const orders = ordersRes.rows.map(rowToOrder);

  // items de todas las órdenes de la página en una query
  const orderIds = orders.map((o) => o.id);
  let itemsByOrder = new Map<number, any[]>();
  if (orderIds.length > 0) {
    const itemsRes = await pool.query(
      'SELECT * FROM order_items WHERE order_id = ANY($1) ORDER BY id',
      [orderIds]
    );
    for (const row of itemsRes.rows) {
      const arr = itemsByOrder.get(row.order_id) ?? [];
      arr.push(rowToItem(row));
      itemsByOrder.set(row.order_id, arr);
    }
  }

  return {
    data: orders.map((o) => ({ ...o, items: itemsByOrder.get(o.id) ?? [] })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// =============================================
// CONFIRMAR PEDIDO -> descuenta stock de cada item
// =============================================
export const confirmOrder = async (
  id: number
): Promise<{ order: OrderWithItems; stockWarnings: string[] }> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderRes = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
    if (orderRes.rows.length === 0) throw new Error('Pedido no encontrado');
    const order = orderRes.rows[0];
    if (order.status === 'confirmado') {
      throw new Error('El pedido ya está confirmado');
    }

    const itemsRes = await client.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id]
    );

    const stockWarnings: string[] = [];

    for (const it of itemsRes.rows) {
      if (it.product_id == null) continue; // producto borrado: no hay stock que tocar

      const prodRes = await client.query(
        'SELECT stock FROM products WHERE id = $1 FOR UPDATE',
        [it.product_id]
      );
      if (prodRes.rows.length === 0) continue;

      const current = prodRes.rows[0].stock ?? 0;
      const nuevo = current - it.qty;
      if (nuevo < 0) {
        stockWarnings.push(
          `${it.product_name}: stock quedó en ${nuevo} (había ${current}, se pidieron ${it.qty})`
        );
      }
      await client.query('UPDATE products SET stock = $1 WHERE id = $2', [nuevo, it.product_id]);
    }

    await client.query(
      `UPDATE orders SET status = 'confirmado', confirmed_at = NOW() WHERE id = $1`,
      [id]
    );

    await client.query('COMMIT');

    const finalOrder = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
    const finalItems = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY id',
      [id]
    );
    return {
      order: { ...rowToOrder(finalOrder.rows[0]), items: finalItems.rows.map(rowToItem) },
      stockWarnings,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// =============================================
// DESCARTAR PEDIDO (no toca stock)
// =============================================
export const discardOrder = async (id: number): Promise<Order> => {
  const res = await pool.query(
    `UPDATE orders SET status = 'descartado' WHERE id = $1 AND status <> 'confirmado' RETURNING *`,
    [id]
  );
  if (res.rows.length === 0) {
    throw new Error('Pedido no encontrado o ya confirmado (no se puede descartar)');
  }
  return rowToOrder(res.rows[0]);
};

// =============================================
// CONTADOR DE PENDIENTES (para el dashboard)
// =============================================
export const countPending = async (): Promise<number> => {
  const res = await pool.query(`SELECT COUNT(*) FROM orders WHERE status = 'pendiente'`);
  return parseInt(res.rows[0].count);
};
