import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const mockData = [
  { month: "Jan", pagas: 0, comDesconto: 0, comAtraso: 0 },
  { month: "Fev", pagas: 0, comDesconto: 0, comAtraso: 0 },
  { month: "Mar", pagas: 0, comDesconto: 0, comAtraso: 0 },
  { month: "Abr", pagas: 0, comDesconto: 0, comAtraso: 0 },
  { month: "Mai", pagas: 0, comDesconto: 0, comAtraso: 0 },
  { month: "Jun", pagas: 0, comDesconto: 0, comAtraso: 0 },
  { month: "Jul", pagas: 0, comDesconto: 0, comAtraso: 0 },
  { month: "Ago", pagas: 0, comDesconto: 0, comAtraso: 0 },
  { month: "Set", pagas: 0, comDesconto: 0, comAtraso: 0 },
  { month: "Out", pagas: 0, comDesconto: 0, comAtraso: 0 },
  { month: "Nov", pagas: 0, comDesconto: 0, comAtraso: 0 },
  { month: "Dez", pagas: 0, comDesconto: 0, comAtraso: 0 },
];

export function YearlyChart() {
  return (
    <Card className="card-elevated rounded-2xl p-6 md:p-8">
      <h3 className="text-lg md:text-xl font-bold text-center text-foreground mb-6">
        MENSALIDADES POR ANO
      </h3>

      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full shadow-sm shadow-green-500/30" />
          <span className="text-xs md:text-sm text-muted-foreground font-medium">Pagas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full shadow-sm shadow-cyan-500/30" />
          <span className="text-xs md:text-sm text-muted-foreground font-medium">Pagas com Desconto</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-red-500 rounded-full shadow-sm shadow-red-500/30" />
          <span className="text-xs md:text-sm text-muted-foreground font-medium">Pagas com Atraso</span>
        </div>
      </div>

      <div className="h-64 md:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickFormatter={(value) => `R$ ${value}`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "var(--shadow-lg)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey="pagas"
              stroke="#22c55e"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, fill: "#22c55e", stroke: "#fff", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="comDesconto"
              stroke="#06b6d4"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, fill: "#06b6d4", stroke: "#fff", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="comAtraso"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
