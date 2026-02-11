import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Order {
  id: string;
  nome: string;
  mes: string;
  pagamento: string;
  valor: number;
  status: string;
  dataCriacao: Timestamp;
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
    if (!db) {
      console.warn("Firebase não inicializado - ordens recentes não serão carregadas");
      setLoading(false);
      return;
    }

    const colRef = collection(db, "recentes");

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();

          return {
            id: doc.id,
            nome: d.nome ?? "-",
            mes: d.mes ?? "-",
            pagamento: d.pagamento ?? "-",
            valor: Number(d.valor ?? 0),
            status: d.status ?? "Criado",
            dataCriacao: d.dataCriacao,
          } as Order;
        });

        // Sort client-side by dataCriacao descending
        data.sort((a, b) => {
          const timeA = a.dataCriacao?.toMillis?.() ?? 0;
          const timeB = b.dataCriacao?.toMillis?.() ?? 0;
          return timeB - timeA;
        });

        setOrders(data);
        setLoading(false);
      },
      (error) => {
        console.error("Erro no listener de ordens:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
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
        <p className="text-center text-muted-foreground text-sm">Carregando ordens em tempo real...</p>
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
