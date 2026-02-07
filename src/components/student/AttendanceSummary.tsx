import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";

interface AttendanceSummaryProps {
  presentes: number;
  totalAulas: number;
}

export function AttendanceSummary({ presentes, totalAulas }: AttendanceSummaryProps) {
  if (totalAulas === 0) return null;

  const percentage = Math.round((presentes / totalAulas) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Presença este mês</p>
              <p className="text-xs text-muted-foreground">
                {presentes} de {totalAulas} aulas ({percentage}%)
              </p>
            </div>
          </div>
          <Progress value={percentage} className="h-2" />
        </CardContent>
      </Card>
    </motion.div>
  );
}
