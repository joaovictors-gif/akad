import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface MensalidadeStatusCardProps {
  pendentes: number;
  atrasadas: number;
  pagas: number;
  total: number;
  isConvenio: boolean;
}

export function MensalidadeStatusCard({ pendentes, atrasadas, pagas, total, isConvenio }: MensalidadeStatusCardProps) {
  if (isConvenio) return null;

  const getStatus = () => {
    if (atrasadas > 0) return "atrasado";
    if (pendentes > 0) return "pendente";
    return "emDia";
  };

  const status = getStatus();

  const statusConfig = {
    atrasado: {
      icon: XCircle,
      label: "Mensalidade Atrasada",
      description: `Você tem ${atrasadas} mensalidade${atrasadas > 1 ? "s" : ""} atrasada${atrasadas > 1 ? "s" : ""}`,
      bgClass: "from-red-500/10 to-red-500/5 border-red-500/30",
      iconClass: "text-red-500 bg-red-500/20",
    },
    pendente: {
      icon: AlertTriangle,
      label: "Mensalidade Pendente",
      description: `Você tem ${pendentes} mensalidade${pendentes > 1 ? "s" : ""} pendente${pendentes > 1 ? "s" : ""}`,
      bgClass: "from-yellow-500/10 to-yellow-500/5 border-yellow-500/30",
      iconClass: "text-yellow-500 bg-yellow-500/20",
    },
    emDia: {
      icon: CheckCircle2,
      label: "Tudo em dia!",
      description: `${pagas} de ${total} mensalidades pagas`,
      bgClass: "from-green-500/10 to-green-500/5 border-green-500/30",
      iconClass: "text-green-500 bg-green-500/20",
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className={`mb-6 bg-gradient-to-r ${config.bgClass}`}>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${config.iconClass}`}>
              <StatusIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">{config.label}</h3>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
