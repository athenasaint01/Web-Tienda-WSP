import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TopConsultedProduct } from '../../services/api';

/**
 * Gráfico de barras horizontales: por producto, clics a WhatsApp vs vistas de ficha.
 * Se carga de forma diferida (React.lazy) para no pesar en el bundle principal.
 * `data` ya viene ordenado por clics a WhatsApp (desc); recharts pinta de
 * arriba a abajo, así que el #1 queda arriba tal cual.
 */
export default function TopConsultedChart({ data }: { data: TopConsultedProduct[] }) {
  const chartData = [...data]
    .slice(0, 8)
    .map((p) => ({
      name: p.name.length > 22 ? p.name.slice(0, 21) + '…' : p.name,
      fullName: p.name,
      Consultas: p.wa_click_count,
      Vistas: p.view_count,
    }));

  // Alto dinámico: ~44px por barra, mínimo 220.
  const height = Math.max(220, chartData.length * 48 + 40);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
          barGap={2}
        >
          <CartesianGrid horizontal={false} stroke="#f0f0f0" />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#a3a3a3' }}
            axisLine={{ stroke: '#e5e5e5' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 11, fill: '#525252' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e5e5' }}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.fullName ?? ''
            }
          />
          <Bar dataKey="Consultas" fill="#059669" radius={[0, 3, 3, 0]} maxBarSize={18} />
          <Bar dataKey="Vistas" fill="#d4d4d4" radius={[0, 3, 3, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
