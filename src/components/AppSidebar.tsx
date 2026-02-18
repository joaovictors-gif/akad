import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutGrid,
  User,
  Award,
  Settings,
  CreditCard,
  FileText,
  Clock,
  LogOut,
  X,
  ClipboardCheck,
  ShoppingBag,
} from "lucide-react";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutGrid },
  { title: "Alunos", url: "/alunos", icon: User },
  { title: "Exame de faixa", url: "/exame-faixa", icon: Award },
  { title: "Cidades e Valores", url: "/cidades-valores", icon: Settings },
  { title: "Horários", url: "/horarios", icon: Clock },
  { title: "Frequência", url: "/frequencia", icon: ClipboardCheck },
  { title: "Mensalidades", url: "/mensalidades", icon: CreditCard },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
  { title: "Loja", url: "/loja", icon: ShoppingBag },
];

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleNavigation = (url: string) => {
    navigate(url);
    onClose();
  };

  const isActive = (path: string) => location.pathname === path;

  const userInitial = currentUser?.email?.charAt(0).toUpperCase() || "N";

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50
          w-72 h-screen sidebar-gradient flex flex-col
          transform transition-all duration-300 ease-out
          border-r border-border/30
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Header with Logo and Close button */}
        <div className="p-6 pb-8 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-wider text-gradient">
            AKAD
          </h1>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 overflow-y-auto">
          <ul className="space-y-1.5">
            {menuItems.map((item, index) => {
              const active = isActive(item.url);
              return (
                <li key={item.title} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <button
                    onClick={() => handleNavigation(item.url)}
                    className={`
                      w-full flex items-center gap-4 px-4 py-3.5 rounded-xl
                      transition-all duration-200 group
                      ${active
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }
                    `}
                  >
                    <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${!active && "group-hover:scale-110"}`} />
                    <span className="text-sm font-medium">{item.title}</span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse-subtle" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer - Logout */}
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] mt-auto">
          <div className="divider-gradient mb-4" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-sm font-bold text-foreground ring-2 ring-border/50 shrink-0">
              {userInitial}
            </div>
            <span className="text-sm font-medium">Sair</span>
            <LogOut className="h-4 w-4 ml-auto transition-transform duration-200 group-hover:translate-x-1 shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
}
