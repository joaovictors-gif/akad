import { ReactNode } from "react";
import { StudentBottomNav } from "./StudentBottomNav";

interface StudentLayoutProps {
  children: ReactNode;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {children}
      <StudentBottomNav />
    </div>
  );
}
