import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '../../../services/api';
import type { Order } from '../../../services/api';

type Pagination = { page: number; limit: number; total: number; totalPages: number };

const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'confirmado', label: 'Confirmados' },
  { key: 'descartado', label: 'Descartados' },
  { key: '', label: 'Todos' },
];

const STATUS_BADGE: Record<Order['status'], string> = {
  pendiente: 'bg-amber-100 text-amber-800',
  confirmado: 'bg-emerald-100 text-emerald-800',
  descartado: 'bg-neutral-100 text-neutral-500',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pendiente');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [acting, setActing] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getOrders({ status: status || undefined, page, limit: 20 });
      setOrders(res.data);
      setPagination(res.pagination);
    } catch {
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const changeTab = (key: string) => {
    setStatus(key);
    setPage(1);
    setExpanded(null);
  };

  const confirm = async (order: Order) => {
    const money = `${order.currency_symbol} ${order.subtotal}`;
    if (
      !window.confirm(
        `Confirmar el pedido de ${order.customer_name} (${money})?\n\nEsto descontará el stock de cada producto. No se puede deshacer.`
      )
    )
      return;
    try {
      setActing(order.id);
      const res = await api.confirmOrder(order.id);
      if (res.warnings && res.warnings.length > 0) {
        toast.warning(
          `Pedido confirmado, pero: ${res.warnings.join(' · ')}`,
          { duration: 8000 }
        );
      } else {
        toast.success('Pedido confirmado y stock actualizado');
      }
      load();
    } catch (e: any) {
      toast.error(e.message || 'Error al confirmar');
    } finally {
      setActing(null);
    }
  };

  const discard = async (order: Order) => {
    if (!window.confirm(`¿Descartar el pedido de ${order.customer_name}?`)) return;
    try {
      setActing(order.id);
      await api.discardOrder(order.id);
      toast.success('Pedido descartado');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Error al descartar');
    } finally {
      setActing(null);
    }
  };

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Pedidos</h1>
        <p className="text-neutral-600 mt-1">
          Pedidos generados desde el carrito. Confirma los que se concretaron para descontar stock.
        </p>
      </div>

      {/* Tabs de estado */}
      <div className="flex flex-wrap gap-1 mb-4 border-b border-neutral-200">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => changeTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              status === t.key
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto" />
          <p className="text-neutral-600 mt-4">Cargando...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center text-neutral-600">
          No hay pedidos {status ? STATUS_TABS.find((t) => t.key === status)?.label.toLowerCase() : ''}.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((o) => {
              const isOpen = expanded === o.id;
              return (
                <div key={o.id} className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                  {/* Fila principal */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : o.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-neutral-900">{o.customer_name}</span>
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${STATUS_BADGE[o.status]}`}
                        >
                          {o.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {fmtDate(o.created_at)}
                        {o.customer_phone && ` · ${o.customer_phone}`}
                        {` · ${o.items.reduce((s, i) => s + i.qty, 0)} art.`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-medium text-neutral-900">
                        {o.currency_symbol} {o.subtotal}
                        {o.has_unpriced && <span className="text-xs text-neutral-400"> (parcial)</span>}
                      </p>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-neutral-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                    )}
                  </button>

                  {/* Detalle */}
                  {isOpen && (
                    <div className="border-t border-neutral-100 px-5 py-4 bg-neutral-50/50">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-neutral-100">
                          {o.items.map((it) => (
                            <tr key={it.id}>
                              <td className="py-2 pr-3">
                                {it.product_slug ? (
                                  <a
                                    href={`/producto/${it.product_slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-neutral-800 hover:underline"
                                  >
                                    {it.product_name}
                                  </a>
                                ) : (
                                  <span className="text-neutral-500">{it.product_name}</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-neutral-500 tabular-nums text-right">×{it.qty}</td>
                              <td className="py-2 pl-3 text-neutral-700 tabular-nums text-right">
                                {it.line_total != null
                                  ? `${o.currency_symbol} ${it.line_total}`
                                  : 'a consultar'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {o.status === 'pendiente' && (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => confirm(o)}
                            disabled={acting === o.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Confirmar y descontar stock
                          </button>
                          <button
                            onClick={() => discard(o)}
                            disabled={acting === o.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Descartar
                          </button>
                        </div>
                      )}
                      {o.status === 'confirmado' && o.confirmed_at && (
                        <p className="text-xs text-emerald-700 mt-3">
                          Confirmado el {fmtDate(o.confirmed_at)} · stock descontado
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-neutral-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <span className="text-sm text-neutral-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-neutral-50"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
