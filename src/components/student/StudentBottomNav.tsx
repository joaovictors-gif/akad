import { Home, Calendar, CreditCard, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home, label: "Início", path: "/aluno" },
  { icon: Calendar, label: "Aulas", path: "/aluno/aulas" },
  { icon: CreditCard, label: "Mensalidades", path: "/aluno/mensalidades" },
  { icon: User, label: "Perfil", path: "/aluno/perfil" },
];

export function StudentBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <nav className="mx-auto max-w-md rounded-2xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/20">
        <div className="flex items-center justify-around h-[4.25rem] px-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-2 transition-colors min-w-[4.5rem]",
                  isActive
                    ? "bg-primary/15"
                    : "text-muted-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive
                      ? "text-primary stroke-[2.5]"
                      : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] transition-colors",
                    isActive
                      ? "text-primary font-bold"
                      : "text-muted-foreground font-medium"
                  )}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
