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
import { useEffect, useState } from "react";
import { useDashboardDate } from "@/contexts/DashboardDateContext";
import { Loader2 } from "lucide-react";

const API_BASE = "https://us-central1-akad-fbe7e.cloudfunctions.net/app/dashboard";

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface ChartData {
  month: string;
  pagas: number;
  comDesconto: number;
  comAtraso: number;
}

interface GraficoResponse {
  ano_consultado: string;
  totais_por_mes: {
    [mes: string]: {
      "Pago": number;
      "Pago com Atraso": number;
      "Pago com Desconto": number;
    };
  };
}

export function YearlyChart() {
  const { getYearAbbr, selectedYear } = useDashboardDate();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGraficoData = async () => {
      setIsLoading(true);
      try {
        const yearAbbr = getYearAbbr();
        const response = await fetch(`${API_BASE}/grafico/${yearAbbr}`);
        
        if (!response.ok) {
          throw new Error("Erro ao carregar dados do gráfico");
        }

        const data: GraficoResponse = await response.json();
        
        // Transform API response to chart format
        const transformedData: ChartData[] = monthNames.map((month, index) => {
          const mesKey = String(index + 1).padStart(2, "0");
          const mesData = data.totais_por_mes[mesKey] || { "Pago": 0, "Pago com Atraso": 0, "Pago com Desconto": 0 };
          
          return {
            month,
            pagas: mesData["Pago"] || 0,
            comDesconto: mesData["Pago com Desconto"] || 0,
            comAtraso: mesData["Pago com Atraso"] || 0,
          };
        });

        setChartData(transformedData);
      } catch (error) {
        console.error("Erro ao carregar gráfico:", error);
        // Set empty data on error
        setChartData(monthNames.map(month => ({
          month,
          pagas: 0,
          comDesconto: 0,
          comAtraso: 0,
        })));
      } finally {
        setIsLoading(false);
      }
    };

    fetchGraficoData();
  }, [selectedYear, getYearAbbr]);

  return (
    <Card className="card-elevated rounded-2xl p-6 md:p-8">
      <h3 className="text-lg md:text-xl font-bold text-center text-foreground mb-6">
        MENSALIDADES {selectedYear}
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
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
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
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, ""]}
              />
              <Line
                type="monotone"
                dataKey="pagas"
                name="Pagas"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, fill: "#22c55e", stroke: "#fff", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="comDesconto"
                name="Com Desconto"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, fill: "#06b6d4", stroke: "#fff", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="comAtraso"
                name="Com Atraso"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
