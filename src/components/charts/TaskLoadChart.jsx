import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function TaskLoadChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
        <CartesianGrid stroke="#eeeeee" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#eeeeee' }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#fff', border: '0.5px solid #eeeeee', borderRadius: 10, fontSize: 12 }}
          formatter={(value) => [`${value} task${value === 1 ? '' : 's'}`, 'Due']}
          cursor={{ fill: '#f5f5f0' }}
        />
        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
