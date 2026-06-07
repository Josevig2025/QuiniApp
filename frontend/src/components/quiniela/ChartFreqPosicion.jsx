/**
 * components/quiniela/ChartFreqPosicion.jsx
 * Gráfico de barras: frecuencia de aparición por posición (1°–20°).
 * Resalta las posiciones con mayor frecuencia.
 */
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer,
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-lg"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      <p style={{ color: 'var(--text-muted)' }}>Posición {label}°</p>
      <p style={{ color: 'var(--accent-cyan)', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
        {payload[0].value} apariciones
      </p>
    </div>
  )
}

export default function ChartFreqPosicion({ freqPosicion = {} }) {
  // Construir array de pos 1..20 aunque no todas tengan datos
  const data = Array.from({ length: 20 }, (_, i) => ({
    pos:   i + 1,
    frec:  freqPosicion[i + 1] ?? 0,
  }))

  const maxFrec = Math.max(...data.map(d => d.frec), 1)

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border, rgba(255,255,255,0.06))"
          vertical={false}
        />
        <XAxis
          dataKey="pos"
          tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
          width={28}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="frec" radius={[3, 3, 0, 0]} maxBarSize={18}>
          {data.map((entry) => {
            // Barra más brillante cuanto más alta
            const ratio   = entry.frec / maxFrec
            const opacity = 0.3 + ratio * 0.7
            return (
              <Cell
                key={`cell-${entry.pos}`}
                fill={`rgba(0,229,255,${opacity})`}
              />
            )
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
