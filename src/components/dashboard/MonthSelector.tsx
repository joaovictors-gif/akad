import { Calendar } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDashboardDate } from "@/contexts/DashboardDateContext";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1];

export function MonthSelector() {
  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = useDashboardDate();
  const [tempMonth, setTempMonth] = useState(selectedMonth);
  const [tempYear, setTempYear] = useState(selectedYear);
  const [open, setOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setTempMonth(selectedMonth);
      setTempYear(selectedYear);
    }
    setOpen(isOpen);
  };

  const handleConfirm = () => {
    setSelectedMonth(tempMonth);
    setSelectedYear(tempYear);
    setOpen(false);
  };

  return (
    <div className="flex flex-col items-center sm:items-start w-full sm:w-auto">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-xl md:text-3xl font-bold text-foreground mb-2">
            {months[selectedMonth]} de {selectedYear}
          </h2>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm rounded-xl border border-primary/30 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10">
                <Calendar className="h-4 w-4" />
                Alterar Data
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Seletor de Data
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Year Selection */}
                <div>
                  <p className="font-semibold mb-3">1. Selecione o Ano:</p>
                  <div className="flex gap-3">
                    {years.map((year) => (
                      <button
                        key={year}
                        onClick={() => setTempYear(year)}
                        className={`px-6 py-2 rounded-lg border transition-colors ${
                          tempYear === year
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted border-border hover:bg-muted/80"
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Month Selection */}
                <div>
                  <p className="font-semibold mb-3">2. Selecione o Mês:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {months.map((month, index) => (
                      <button
                        key={month}
                        onClick={() => setTempMonth(index)}
                        className={`px-4 py-2 rounded-lg border transition-colors text-sm ${
                          tempMonth === index
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted border-border hover:bg-muted/80"
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={handleConfirm} className="w-full">
                Confirmar Seleção
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
