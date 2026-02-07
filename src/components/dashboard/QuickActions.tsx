import { useNavigate } from "react-router-dom";
import { UserPlus, ClipboardCheck, CreditCard, Clock, Award, FileText } from "lucide-react";
import { motion } from "framer-motion";

const quickActions = [
  {
    label: "Novo Aluno",
    icon: UserPlus,
    route: "/alunos",
    color: "from-primary to-primary/80",
  },
  {
    label: "Frequência",
    icon: ClipboardCheck,
    route: "/frequencia",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    label: "Mensalidades",
    icon: CreditCard,
    route: "/mensalidades",
    color: "from-cyan-500 to-cyan-600",
  },
  {
    label: "Horários",
    icon: Clock,
    route: "/horarios",
    color: "from-amber-500 to-amber-600",
  },
  {
    label: "Exame de Faixa",
    icon: Award,
    route: "/exame-faixa",
    color: "from-purple-500 to-purple-600",
  },
  {
    label: "Relatórios",
    icon: FileText,
    route: "/relatorios",
    color: "from-rose-500 to-rose-600",
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {quickActions.map((action, index) => (
        <motion.button
          key={action.label}
          onClick={() => navigate(action.route)}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-200 group"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${action.color} text-white shadow-md group-hover:shadow-lg transition-shadow`}>
            <action.icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
            {action.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
