import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { SalesSummaryPoint } from '../../services/api';

/**
 * Gráfico de área: monto vendido (pedidos confirmados) por día.
 * Se carga de forma diferida (React.lazy) para no pesar en el bundle principal.
 */
export default function SalesChart({
  data,
  currency,
}: {
  data: SalesSummaryPoint[];
  currency: string;
}) {
  const chartData = data.map((p) => ({
    // 'YYYY-MM-DD' -> 'DD/MM' para el eje, sin depender de timezone del navegador
    label: `${p.date.slice(8, 10)}/${p.date.slice(5, 7)}`,
    fullDate: p.date,
    total: p.total,
    count: p.count,
  }));

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#a3a3a3' }}
            axisLine={{ stroke: '#e5e5e5' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#a3a3a3' }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e5e5' }}
            formatter={(value: number) => [`${currency} ${value.toFixed(2)}`, 'Vendido']}
            labelFormatter={(_: unknown, payload: any) => payload?.[0]?.payload?.fullDate ?? ''}
          />
          <Area type="monotone" dataKey="total" stroke="#059669" strokeWidth={2} fill="url(#salesFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
