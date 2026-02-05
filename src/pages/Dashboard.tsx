import { useState } from "react";
import { TrendingUp, Tag, Clock, Menu } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { PaymentCard } from "@/components/dashboard/PaymentCard";
import { YearlyChart } from "@/components/dashboard/YearlyChart";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { staggerContainerVariants, staggerItemVariants } from "@/components/PageTransition";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <OnboardingModal isAdmin={true} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 h-screen overflow-y-auto">
        {/* Mobile Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="lg:hidden sticky top-0 z-30 glass border-b border-border/30 p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 rounded-xl hover:bg-muted/80 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="h-5 w-5 text-foreground" />
            </motion.button>
            <h1 className="text-xl font-extrabold tracking-wider text-gradient">AKAD</h1>
          </div>
          <ThemeToggle />
        </motion.header>
        
        {/* Desktop Header */}
        <div className="hidden lg:flex justify-end items-center gap-3 p-4 pb-0">
          <ThemeToggle />
        </div>

        <main className="p-4 md:p-6 lg:p-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <MonthSelector />
          </motion.div>

          {/* Payment Cards */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8"
            variants={staggerContainerVariants}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={staggerItemVariants}>
              <PaymentCard
                title="Total de pagamentos"
                value="R$ 0,00"
                percentage={0}
                icon={TrendingUp}
                iconBgColor="bg-gradient-to-br from-green-500 to-green-600"
              />
            </motion.div>
            <motion.div variants={staggerItemVariants}>
              <PaymentCard
                title="Pagamentos com desconto"
                value="R$ 0,00"
                percentage={0}
                icon={Tag}
                iconBgColor="bg-gradient-to-br from-cyan-500 to-cyan-600"
              />
            </motion.div>
            <motion.div variants={staggerItemVariants}>
              <PaymentCard
                title="Pagamentos em atraso"
                value="R$ 0,00"
                percentage={0}
                icon={Clock}
                iconBgColor="bg-gradient-to-br from-red-500 to-red-600"
              />
            </motion.div>
          </motion.div>

          {/* Yearly Chart */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <YearlyChart />
          </motion.div>

          {/* Recent Orders Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <RecentOrdersTable />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
