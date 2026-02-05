import { useState, useEffect, useCallback } from "react";
import { getMessaging, getToken, onMessage, isSupported as isFCMSupported } from "firebase/messaging";
import app from "@/lib/firebase";
import { toast } from "sonner";

const VAPID_KEY = "BLBavgKV8CL2NYhWTr8e8yybUeVgqD309N9geSmasrsZSPfxerO9pi-CRycJpCIPxWzyt5vRh798yoWJAfz0co4";

export const usePushNotifications = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 🔍 Verifica suporte real
   */
  useEffect(() => {
    (async () => {
      const supported = (await isFCMSupported()) && "serviceWorker" in navigator && "Notification" in window;

      setIsSupported(supported);
      setIsPermissionGranted(Notification.permission === "granted");
    })();
  }, []);

  /**
   * 🔔 FOREGROUND MESSAGE
   */
  useEffect(() => {
    if (!isSupported) return;

    const messaging = getMessaging(app);

    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || "AKAD";
      const body = payload.notification?.body || payload.data?.body || "";

      toast.info(title, { description: body });
    });

    return unsubscribe;
  }, [isSupported]);

  /**
   * 🔐 Solicitar permissão
   */
  const requestPermission = useCallback(async () => {
    if (!isSupported) return null;

    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return null;

      // ✅ Registra o SW dedicado do FCM (evita conflito com o SW do PWA)
      const swRegistration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/firebase-cloud-messaging-push-scope" },
      );

      // Garante que a versão mais recente assuma
      await swRegistration.update();

      // Espera ativar (alguns navegadores demoram a ativar após register/update)
      if (!swRegistration.active) {
        await new Promise<void>((resolve) => {
          const sw = swRegistration.installing || swRegistration.waiting;
          if (!sw) return resolve();
          sw.addEventListener("statechange", () => {
            if (sw.state === "activated") resolve();
          });
        });
      }

      const messaging = getMessaging(app);
      const fcmToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });

      if (fcmToken) {
        setToken(fcmToken);
        setIsPermissionGranted(true);
        return fcmToken;
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    token,
    isSupported,
    isPermissionGranted,
    isLoading,
    requestPermission,
  };
};
