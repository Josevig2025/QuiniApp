/**
 * components/quiniela/ChartGaps.jsx
 * Gráfico de línea con el historial de gaps de un número.
 * Usa Recharts. Muestra una línea de referencia del gap promedio.
 */
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Area, AreaChart,
} from 'recharts'

// ── Tooltip personalizado ─────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  const color = val <= 20 ? '#22C55E' : val <= 100 ? '#F59E0B' : '#EF4444'
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-lg"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      <p style={{ color: 'var(--text-muted)' }}>Intervalo #{label}</p>
      <p style={{ color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
        Gap: {val}
      </p>
    </div>
  )
}

export default function ChartGaps({ gaps = [], promedio }) {
  if (!gaps || gaps.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-muted">
        Sin suficientes datos para graficar
      </div>
    )
  }

  // Construir datos para Recharts
  const data = gaps.map((g, i) => ({ x: i + 1, gap: g }))

  // Color dinámico por punto
  const getColor = (v) =>
    v <= 20 ? '#22C55E' : v <= 100 ? '#F59E0B' : '#EF4444'

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gapGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="var(--accent-cyan, #00E5FF)" stopOpacity={0.18} />
            <stop offset="95%" stopColor="var(--accent-cyan, #00E5FF)" stopOpacity={0}    />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border, rgba(255,255,255,0.06))"
          vertical={false}
        />

        <XAxis
          dataKey="x"
          tick={{ fontSize: 10, fill: 'var(--text-muted, #4B5675)', fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
        />

        <YAxis
          tick={{ fontSize: 10, fill: 'var(--text-muted, #4B5675)', fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
          width={32}
        />

        <Tooltip content={<CustomTooltip />} />

        {/* Línea de referencia: gap promedio */}
        {promedio != null && (
          <ReferenceLine
            y={promedio}
            stroke="var(--accent-cyan, #00E5FF)"
            strokeDasharray="5 3"
            strokeOpacity={0.5}
            label={{
              value: `prom ${promedio}`,
              position: 'insideTopRight',
              fontSize: 10,
              fill: 'var(--accent-cyan, #00E5FF)',
              fontFamily: 'JetBrains Mono',
            }}
          />
        )}

        <Area
          type="monotone"
          dataKey="gap"
          stroke="var(--accent-cyan, #00E5FF)"
          strokeWidth={2}
          fill="url(#gapGradient)"
          dot={(props) => {
            const { cx, cy, value } = props
            return (
              <circle
                key={`dot-${cx}-${cy}`}
                cx={cx} cy={cy} r={3}
                fill={getColor(value)}
                stroke="var(--bg-card, #131620)"
                strokeWidth={1.5}
              />
            )
          }}
          activeDot={{ r: 5, strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
