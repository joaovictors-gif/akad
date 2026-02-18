import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveStudent } from "@/contexts/ActiveStudentContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Clock, CheckCircle, XCircle, Package, PackageCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface Pedido {
  id: string;
  produtoNome: string;
  produtoValor: number;
  criadoEm: string;
  status: "pendente" | "confirmado" | "cancelado" | "entregue";
}

const statusConfig = {
  pendente: { label: "Pendente", icon: Clock, className: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30" },
  confirmado: { label: "Confirmado", icon: CheckCircle, className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  entregue: { label: "Entregue", icon: PackageCheck, className: "bg-primary/15 text-primary border-primary/30" },
  cancelado: { label: "Cancelado", icon: XCircle, className: "bg-destructive/15 text-destructive border-destructive/30" },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function StudentOrders() {
  const { currentUser } = useAuth();
  const { activeStudentId } = useActiveStudent();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const studentId = activeStudentId || currentUser?.uid;

  useEffect(() => {
    if (!studentId || !db) {
      setLoading(false);
      return;
    }

    const pedidosRef = collection(db, `pedidos/${studentId}/itens`);
    const q = query(pedidosRef, orderBy("criadoEm", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Pedido[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Pedido[];
      setPedidos(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [studentId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Meus Pedidos</h3>
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  if (pedidos.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Meus Pedidos</h3>
      {pedidos.map((pedido, index) => {
        const config = statusConfig[pedido.status] || statusConfig.pendente;
        const StatusIcon = config.icon;
        return (
          <motion.div
            key={pedido.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{pedido.produtoNome}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(pedido.criadoEm).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-sm text-foreground">{formatCurrency(pedido.produtoValor)}</span>
                  <Badge variant="outline" className={`gap-1 text-[10px] ${config.className}`}>
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
