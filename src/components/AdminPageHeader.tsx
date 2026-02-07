import { Menu } from "lucide-react";
import { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  rightContent?: ReactNode;
}

export function AdminPageHeader({ title, subtitle, onMenuClick, rightContent }: AdminPageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 glass border-b border-border/30">
      <div className="px-4 md:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="p-2.5 rounded-xl hover:bg-muted/80 transition-all duration-200 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          {rightContent && (
            <div className="flex items-center gap-2">
              {rightContent}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
