import { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const API_BASE = "https://us-central1-akad-fbe7e.cloudfunctions.net/app";

interface Order {
  id: string;
  nome: string;
  mes: string;
  pagamento: string;
  valor: number;
  status: string;
  dataAtualizacao: string | null;
  dataCriacao: string | null;
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "pago":
    case "pago em espécie":
      return "text-green-500";
    case "criado":
      return "text-muted-foreground";
    default:
      return "text-yellow-500";
  }
}

export function RecentOrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_BASE}/recentes`);
        if (!response.ok) throw new Error("Erro ao buscar ordens recentes");
        
        const data = await response.json();
        
        const mapped: Order[] = (Array.isArray(data) ? data : []).map((item: any) => ({
          id: item.id ?? item.uid ?? Math.random().toString(),
          nome: item.nome ?? "-",
          mes: item.mes ?? "-",
          pagamento: item.pagamento ?? "-",
          valor: Number(item.valor ?? 0),
          status: item.status ?? "Criado",
          dataAtualizacao: item.dataAtualizacao?._seconds 
            ? new Date(item.dataAtualizacao._seconds * 1000).toISOString()
            : item.dataAtualizacao ?? null,
          dataCriacao: item.dataCriacao?._seconds
            ? new Date(item.dataCriacao._seconds * 1000).toISOString()
            : item.dataCriacao ?? null,
        }));

        // Sort by dataAtualizacao descending, fallback to dataCriacao
        mapped.sort((a, b) => {
          const dateA = a.dataAtualizacao ?? a.dataCriacao ?? "";
          const dateB = b.dataAtualizacao ?? b.dataCriacao ?? "";
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });

        setOrders(mapped);
      } catch (error) {
        console.error("Erro ao buscar ordens recentes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders.slice(0, 4);
    
    const filtered = orders.filter((order) =>
      order.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.mes.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered.slice(0, 4);
  }, [orders, searchTerm]);

  return (
    <Card className="bg-card border-border p-4 md:p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-bold text-foreground">ORDENS RECENTES</h3>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ordem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-muted/50 border-border/50 rounded-xl h-10"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground text-sm">Carregando ordens recentes...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-4">Nenhuma ordem encontrada</p>
      ) : (
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="md:min-w-[600px] px-4 md:px-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-xs md:text-sm">NOME</TableHead>
                  <TableHead className="text-xs md:text-sm hidden md:table-cell">MÊS REFERENTE</TableHead>
                  <TableHead className="text-xs md:text-sm hidden md:table-cell">PAGAMENTO</TableHead>
                  <TableHead className="text-xs md:text-sm">VALOR</TableHead>
                  <TableHead className="text-xs md:text-sm">STATUS</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="border-border">
                    <TableCell className="font-medium text-xs md:text-sm">{order.nome}</TableCell>
                    <TableCell className="text-muted-foreground text-xs md:text-sm hidden md:table-cell">{order.mes}</TableCell>
                    <TableCell className="text-xs md:text-sm hidden md:table-cell">{order.pagamento}</TableCell>
                    <TableCell className="text-xs md:text-sm">R$ {order.valor.toFixed(2).replace(".", ",")}</TableCell>
                    <TableCell className={`${getStatusColor(order.status)} text-xs md:text-sm`}>
                      {order.status}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </Card>
  );
}
