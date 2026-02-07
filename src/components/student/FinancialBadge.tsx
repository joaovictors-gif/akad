import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface FinancialBadgeProps {
  pendingCount: number;
  overdueCount: number;
  isLoading: boolean;
}

export function FinancialBadge({ pendingCount, overdueCount, isLoading }: FinancialBadgeProps) {
  const navigate = useNavigate();

  if (isLoading) return null;

  const hasPending = pendingCount > 0 || overdueCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <Card
        className={`cursor-pointer transition-colors ${
          overdueCount > 0
            ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
            : pendingCount > 0
            ? "border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50"
            : "border-green-500/30 bg-green-500/5 hover:border-green-500/50"
        }`}
        onClick={() => navigate("/aluno/mensalidades")}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              overdueCount > 0
                ? "bg-red-500/20"
                : pendingCount > 0
                ? "bg-yellow-500/20"
                : "bg-green-500/20"
            }`}>
              {hasPending ? (
                <AlertTriangle className={`h-5 w-5 ${
                  overdueCount > 0 ? "text-red-500" : "text-yellow-500"
                }`} />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {overdueCount > 0
                  ? `${overdueCount} mensalidade${overdueCount > 1 ? "s" : ""} atrasada${overdueCount > 1 ? "s" : ""}`
                  : pendingCount > 0
                  ? `${pendingCount} mensalidade${pendingCount > 1 ? "s" : ""} pendente${pendingCount > 1 ? "s" : ""}`
                  : "Mensalidades em dia"
                }
              </p>
              <p className="text-xs text-muted-foreground">
                {hasPending ? "Toque para visualizar" : "Tudo certo! ✅"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
