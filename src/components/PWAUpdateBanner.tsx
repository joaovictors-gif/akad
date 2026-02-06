import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAUpdate } from "@/hooks/usePWAUpdate";
import { motion, AnimatePresence } from "framer-motion";

export function PWAUpdateBanner() {
  const { needRefresh, updateApp, dismissUpdate } = usePWAUpdate();

  if (!needRefresh) return null;

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm"
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <RefreshCw className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-sm">
                Nova versão disponível!
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Atualize para obter as últimas melhorias.
              </p>
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  onClick={updateApp}
                  className="text-xs h-8"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Atualizar agora
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={dismissUpdate}
                  className="text-xs h-8 text-muted-foreground"
                >
                  Depois
                </Button>
              </div>
            </div>
            <button
              onClick={dismissUpdate}
              className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
