import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const PALETTE = ['#2557f5', '#4d7fff', '#80a8ff', '#1a41d1', '#152a7f', '#6b7280'];

export function SimpleBarChart({
  data,
  colorMap,
  valueFormatter,
  height = 280,
}: {
  data: Array<{ label: string; total: number }>;
  colorMap?: Record<string, string>;
  valueFormatter?: (v: number) => string;
  height?: number;
}) {
  if (!data || data.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">Sem dados para exibir.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 24, right: 24 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
        <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={valueFormatter} />
        <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 12, fill: '#334155' }} />
        <Tooltip formatter={(v: number) => (valueFormatter ? valueFormatter(v) : v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="total" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell key={d.label} fill={colorMap?.[d.label] ?? PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
