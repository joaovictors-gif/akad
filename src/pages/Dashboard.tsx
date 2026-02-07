import { useState, useEffect } from "react";
import { TrendingUp, Tag, Clock, Loader2 } from "lucide-react";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { PaymentCard } from "@/components/dashboard/PaymentCard";
import { YearlyChart } from "@/components/dashboard/YearlyChart";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { staggerContainerVariants, staggerItemVariants } from "@/components/PageTransition";
import { DashboardDateProvider, useDashboardDate } from "@/contexts/DashboardDateContext";

const API_BASE = "https://us-central1-akad-fbe7e.cloudfunctions.net/app/dashboard";

interface CardsData {
  totalPagamentos: string;
  totalComDesconto: string;
  totalEmAtraso: string;
  progressoTotal: number;
  progressoDesconto: number;
  progressoAtraso: number;
}

function DashboardContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cardsData, setCardsData] = useState<CardsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getMonthAbbr, getYearAbbr, selectedMonth, selectedYear } = useDashboardDate();

  useEffect(() => {
    const fetchCardsData = async () => {
      setIsLoading(true);
      try {
        const mes = getMonthAbbr();
        const ano = getYearAbbr();
        const response = await fetch(`${API_BASE}/cards/${mes}/${ano}`);
        
        if (!response.ok) {
          throw new Error("Erro ao carregar dados dos cards");
        }

        const data = await response.json();
        setCardsData({
          totalPagamentos: data.totalPagamentos || "0.00",
          totalComDesconto: data.totalComDesconto || "0.00",
          totalEmAtraso: data.totalEmAtraso || "0.00",
          progressoTotal: data.progressoTotal || 0,
          progressoDesconto: data.progressoDesconto || 0,
          progressoAtraso: data.progressoAtraso || 0,
        });
      } catch (error) {
        console.error("Erro ao carregar cards:", error);
        setCardsData({
          totalPagamentos: "0.00",
          totalComDesconto: "0.00",
          totalEmAtraso: "0.00",
          progressoTotal: 0,
          progressoDesconto: 0,
          progressoAtraso: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCardsData();
  }, [selectedMonth, selectedYear, getMonthAbbr, getYearAbbr]);

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <OnboardingModal isAdmin={true} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 h-screen overflow-y-auto">
        <AdminPageHeader
          title="Dashboard"
          subtitle="Visão geral"
          onMenuClick={() => setSidebarOpen(true)}
          rightContent={<ThemeToggle />}
        />

        <main className="p-4 md:p-6 lg:p-8">
          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <QuickActions />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-6"
          >
            <MonthSelector />
          </motion.div>

          {/* Recent Orders Table - Moved above Payment Cards */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <RecentOrdersTable />
          </motion.div>

          {/* Payment Cards */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8"
            variants={staggerContainerVariants}
            initial="initial"
            animate="animate"
          >
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <motion.div key={i} variants={staggerItemVariants} className="h-48 bg-card rounded-2xl flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </motion.div>
                ))}
              </>
            ) : (
              <>
                <motion.div variants={staggerItemVariants}>
                  <PaymentCard
                    title="Total de pagamentos"
                    value={formatCurrency(cardsData?.totalPagamentos || "0")}
                    percentage={cardsData?.progressoTotal || 0}
                    icon={TrendingUp}
                    iconBgColor="bg-gradient-to-br from-green-500 to-green-600"
                  />
                </motion.div>
                <motion.div variants={staggerItemVariants}>
                  <PaymentCard
                    title="Pagamentos com desconto"
                    value={formatCurrency(cardsData?.totalComDesconto || "0")}
                    percentage={cardsData?.progressoDesconto || 0}
                    icon={Tag}
                    iconBgColor="bg-gradient-to-br from-cyan-500 to-cyan-600"
                  />
                </motion.div>
                <motion.div variants={staggerItemVariants}>
                  <PaymentCard
                    title="Pagamentos em atraso"
                    value={formatCurrency(cardsData?.totalEmAtraso || "0")}
                    percentage={cardsData?.progressoAtraso || 0}
                    icon={Clock}
                    iconBgColor="bg-gradient-to-br from-red-500 to-red-600"
                  />
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Yearly Chart */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <YearlyChart />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

const Dashboard = () => {
  return (
    <DashboardDateProvider>
      <DashboardContent />
    </DashboardDateProvider>
  );
};

export default Dashboard;
