import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#0f2d1a', '#22c55e', '#1e40af', '#f59e0b', '#991b1b', '#64748b']

export default function StatusDonut({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
        >
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#fff',
            border: '0.5px solid #eeeeee',
            borderRadius: 10,
            fontSize: 12
          }}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: '#666' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
