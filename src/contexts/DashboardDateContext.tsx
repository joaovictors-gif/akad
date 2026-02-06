import { createContext, useContext, useState, ReactNode } from "react";

interface DashboardDateContextType {
  selectedMonth: number; // 0-11
  selectedYear: number; // 2025, 2026, etc.
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  getMonthAbbr: () => string; // "01", "02", etc.
  getYearAbbr: () => string; // "25", "26", etc.
}

const DashboardDateContext = createContext<DashboardDateContextType | undefined>(undefined);

export function DashboardDateProvider({ children }: { children: ReactNode }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const getMonthAbbr = () => String(selectedMonth + 1).padStart(2, "0");
  const getYearAbbr = () => String(selectedYear).slice(-2);

  return (
    <DashboardDateContext.Provider
      value={{
        selectedMonth,
        selectedYear,
        setSelectedMonth,
        setSelectedYear,
        getMonthAbbr,
        getYearAbbr,
      }}
    >
      {children}
    </DashboardDateContext.Provider>
  );
}

export function useDashboardDate() {
  const context = useContext(DashboardDateContext);
  if (!context) {
    throw new Error("useDashboardDate must be used within a DashboardDateProvider");
  }
  return context;
}
