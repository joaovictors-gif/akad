import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, "recentes"), orderBy("dataCriacao", "desc"));

    const unsubscribe = onSnapshot(
      q,
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

  return (
    <Card className="bg-card border-border p-4 md:p-6 overflow-hidden">
      <h3 className="text-lg md:text-xl font-bold text-center text-foreground mb-4 md:mb-6">ORDENS RECENTES</h3>

      {loading ? (
        <p className="text-center text-muted-foreground text-sm">Carregando ordens em tempo real...</p>
      ) : (
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="min-w-[600px] px-4 md:px-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-xs md:text-sm">NOME</TableHead>
                  <TableHead className="text-xs md:text-sm">MÊS REFERENTE</TableHead>
                  <TableHead className="text-xs md:text-sm">PAGAMENTO</TableHead>
                  <TableHead className="text-xs md:text-sm">VALOR</TableHead>
                  <TableHead className="text-xs md:text-sm">STATUS</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="border-border">
                    <TableCell className="font-medium text-xs md:text-sm">{order.nome}</TableCell>

                    <TableCell className="text-muted-foreground text-xs md:text-sm">{order.mes}</TableCell>

                    <TableCell className="text-xs md:text-sm">{order.pagamento}</TableCell>

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
