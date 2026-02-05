import { useState } from "react";
import { RefreshCw, Calendar, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const API_BASE_URL = "https://app-vaglvpp5la-uc.a.run.app";

export const UpdateDueDatesModal = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const getNextMonth = () => {
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const handleUpdate = async (startFrom: "current" | "next") => {
    setLoading(true);
    const mesParaIniciar = startFrom === "current" ? getCurrentMonth() : getNextMonth();

    try {
      const response = await fetch(`${API_BASE_URL}/mensalidades/atualizar-vencimentos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mesParaIniciar }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Vencimentos atualizados! ${data.atualizados} mensalidades modificadas.`);
        setOpen(false);
      } else {
        toast.error(data.error || "Erro ao atualizar vencimentos");
      }
    } catch (error) {
      console.error("Erro ao atualizar vencimentos:", error);
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-11 px-3 sm:px-4">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Atualizar Vencimentos</span>
          <span className="sm:hidden">Atualizar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atualizar Vencimentos</DialogTitle>
          <DialogDescription>
            Escolha a partir de qual mês deseja recalcular os status e valores das mensalidades.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-4"
            onClick={() => handleUpdate("current")}
            disabled={loading}
          >
            <Calendar className="h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="font-medium">Mês Atual</p>
              <p className="text-sm text-muted-foreground">
                Atualiza a partir de {getCurrentMonth()}
              </p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-4"
            onClick={() => handleUpdate("next")}
            disabled={loading}
          >
            <CalendarDays className="h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="font-medium">Próximo Mês</p>
              <p className="text-sm text-muted-foreground">
                Atualiza a partir de {getNextMonth()}
              </p>
            </div>
          </Button>
        </div>
        {loading && (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Processando...</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
