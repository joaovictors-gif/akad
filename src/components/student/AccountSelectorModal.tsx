import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useActiveStudent } from "@/contexts/ActiveStudentContext";
import { User, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface AccountSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

const beltColors: Record<string, string> = {
  branca: "bg-white border border-border",
  amarela: "bg-yellow-400",
  laranja: "bg-orange-500",
  verde: "bg-green-500",
  azul: "bg-blue-500",
  roxa: "bg-purple-600",
  marrom: "bg-amber-800",
  preta: "bg-gray-900",
  vermelha: "bg-red-600",
};

export function AccountSelectorModal({ open, onOpenChange, title = "Escolha a conta" }: AccountSelectorModalProps) {
  const { accounts, activeStudentId, switchAccount } = useActiveStudent();

  const handleSelect = (id: string) => {
    switchAccount(id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Selecione qual aluno deseja visualizar
          </p>
        </DialogHeader>

        <div className="px-4 pb-6 space-y-2">
          {accounts.map((account, index) => {
            const isActive = account.id === activeStudentId;
            const beltKey = account.faixa?.toLowerCase() || "";
            const beltColor = beltColors[beltKey] || "bg-muted";

            return (
              <motion.button
                key={account.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelect(account.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${
                  isActive
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-muted/50 border-2 border-transparent hover:bg-muted"
                }`}
              >
                <div className="p-2 rounded-lg bg-background">
                  <User className="h-5 w-5 text-foreground" />
                </div>

                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{account.nome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-block w-3 h-3 rounded-full ${beltColor}`} />
                    <span className="text-xs text-muted-foreground">{account.faixa || "Sem faixa"}</span>
                  </div>
                </div>

                <ChevronRight className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              </motion.button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
