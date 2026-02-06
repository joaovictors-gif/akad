import { useState, useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  const {
    needRefresh: [needRefreshSW, setNeedRefreshSW],
    offlineReady: [offlineReadySW, setOfflineReadySW],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log("[PWA] Service Worker registrado:", swUrl);
      
      // Verifica atualizações periodicamente (a cada 1 hora)
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error("[PWA] Erro ao registrar SW:", error);
    },
  });

  useEffect(() => {
    setNeedRefresh(needRefreshSW);
  }, [needRefreshSW]);

  useEffect(() => {
    setOfflineReady(offlineReadySW);
  }, [offlineReadySW]);

  const updateApp = async () => {
    await updateServiceWorker(true);
  };

  const dismissUpdate = () => {
    setNeedRefreshSW(false);
  };

  return {
    needRefresh,
    offlineReady,
    updateApp,
    dismissUpdate,
  };
}
