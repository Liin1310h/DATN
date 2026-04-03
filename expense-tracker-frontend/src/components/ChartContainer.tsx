// components/ChartContainer.tsx
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const MyAreaChart = ({ data }: { data: any[] }) => (
  <AreaChart
    width={600}
    height={250}
    data={data}
    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
  >
    <defs>
      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
      </linearGradient>
    </defs>
    <CartesianGrid
      strokeDasharray="3 3"
      vertical={false}
      stroke="#e2e8f0"
      opacity={0.2}
    />
    <XAxis
      dataKey="day"
      axisLine={false}
      tickLine={false}
      tick={{ fill: "#94a3b8", fontSize: 12 }}
    />
    <YAxis
      axisLine={false}
      tickLine={false}
      tick={{ fill: "#94a3b8", fontSize: 10 }}
    />
    <Tooltip
      contentStyle={{
        borderRadius: "15px",
        border: "none",
        backgroundColor: "#1e293b",
        color: "#fff",
      }}
    />
    <Area
      type="monotone"
      dataKey="val"
      stroke="#6366f1"
      strokeWidth={3}
      fill="url(#chartGradient)"
      isAnimationActive={false}
    />
  </AreaChart>
);

export const MyPieChart = ({ data }: { data: any[] }) => (
  <PieChart width={200} height={200}>
    <Pie
      data={data}
      innerRadius={60}
      outerRadius={80}
      paddingAngle={8}
      dataKey="value"
      isAnimationActive={false}
    >
      {data.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
      ))}
    </Pie>
    <Tooltip />
  </PieChart>
);
