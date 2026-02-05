import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PaymentCardProps {
  title: string;
  value: string;
  percentage: number;
  icon: LucideIcon;
  iconBgColor: string;
}

export function PaymentCard({ title, value, percentage, icon: Icon, iconBgColor }: PaymentCardProps) {
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="card-elevated card-interactive rounded-2xl p-5 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-xl ${iconBgColor} shadow-lg`}>
          <Icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
        </div>
        <span className="text-muted-foreground text-xs md:text-sm font-medium">{title}</span>
      </div>
      
      <div className="text-2xl md:text-3xl font-bold text-foreground mb-6">
        {value}
      </div>

      <div className="flex flex-col items-center">
        <div className="relative w-20 h-20 md:w-24 md:h-24">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="hsl(var(--muted))"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="url(#progressGradient)"
              strokeWidth="4"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(0 85% 65%)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base md:text-lg font-bold text-foreground">{percentage}%</span>
          </div>
        </div>
        <span className="text-muted-foreground text-xs mt-3 font-medium">Porcentagem mensal</span>
      </div>
    </Card>
  );
}
