import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  linkWithCredential,
  GoogleAuthProvider,
  EmailAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  AuthCredential,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getMessaging, getToken, isSupported as isFCMSupported } from "firebase/messaging";
import { auth, db, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import app from "@/lib/firebase";

/* =======================
   Tipos
======================= */

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<{ success: boolean; email?: string; isAdmin?: boolean }>;
  loginWithApple: () => Promise<void>; // redirect não retorna imediatamente
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/* =======================
   Provider
======================= */

const VAPID_KEY = "BLBavgKV8CL2NYhWTr8e8yybUeVgqD309N9geSmasrsZSPfxerO9pi-CRycJpCIPxWzyt5vRh798yoWJAfz0co4";

const saveAdminFCMToken = async (user: User) => {
  if (!db || !app) return;
  try {
    const supported = (await isFCMSupported()) && "serviceWorker" in navigator && "Notification" in window;
    if (!supported) return;

    // Only request if already granted, don't prompt during login
    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
    }

    const swRegistration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/firebase-cloud-messaging-push-scope" },
    );
    await swRegistration.update();
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
      await setDoc(doc(db, "admin", user.uid), { token: fcmToken }, { merge: true });
      console.log("✅ Admin FCM token saved");
    }
  } catch (error) {
    console.error("Erro ao salvar token FCM do admin:", error);
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* =======================
     Login Email/Senha
  ======================= */

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not configured");
    await signInWithEmailAndPassword(auth, email, password);
  };

  /* =======================
     Login Google (Popup)
  ======================= */

  const loginWithGoogle = async (): Promise<{
    success: boolean;
    email?: string;
    isAdmin?: boolean;
  }> => {
    if (!auth || !googleProvider) {
      throw new Error("Firebase not configured");
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;

      const isNewUser =
        result.user.metadata.creationTime ===
        result.user.metadata.lastSignInTime;

      // ❌ Bloquear usuário novo
      if (isNewUser) {
        await signOut(auth);
        await result.user.delete();
        throw new Error(
          "Email não cadastrado. Entre em contato com a academia para se cadastrar."
        );
      }

      // 🔗 Garantir email/senha
      if (email) {
        try {
          const cred = EmailAuthProvider.credential(email, "000000");
          await linkWithCredential(result.user, cred);
        } catch (e: any) {
          if (e.code !== "auth/provider-already-linked") throw e;
        }
      }

      const domain = email?.toLowerCase().split("@")[1];
      const isAdmin = domain?.startsWith("admin") ?? false;

      return { success: true, email: email ?? undefined, isAdmin };
    } catch (error: any) {
      if (error.message?.includes("não cadastrado")) throw error;

      if (error.code === "auth/account-exists-with-different-credential") {
        const email = error.customData?.email;
        const pendingCredential =
          GoogleAuthProvider.credentialFromError(error);

        if (!email || !pendingCredential) {
          throw new Error("Erro ao obter credenciais do Google");
        }

        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          "000000"
        );

        await linkWithCredential(userCredential.user, pendingCredential);

        const domain = email.toLowerCase().split("@")[1];
        const isAdmin = domain?.startsWith("admin") ?? false;

        return { success: true, email, isAdmin };
      }

      throw error;
    }
  };

  /* =======================
     Login Apple (Redirect)
  ======================= */

  const loginWithApple = async (): Promise<void> => {
    if (!auth) throw new Error("Firebase not configured");

    const appleProvider = new OAuthProvider("apple.com");
    appleProvider.addScope("email");
    appleProvider.addScope("name");

    await signInWithRedirect(auth, appleProvider);
  };

  /* =======================
     Logout
  ======================= */

  const logout = async () => {
    if (!auth) throw new Error("Firebase not configured");
    await signOut(auth);
  };

  /* =======================
     Auth Listener + Redirect
  ======================= */

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // 🔁 Resultado do redirect (Apple)
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result) return;

        const email = result.user.email;
        const isNewUser =
          result.user.metadata.creationTime ===
          result.user.metadata.lastSignInTime;

        // ❌ Bloquear usuário novo
        if (isNewUser) {
          await signOut(auth);
          await result.user.delete();
          throw new Error(
            "Email não cadastrado. Entre em contato com a academia para se cadastrar."
          );
        }

        // 🔗 Garantir email/senha
        if (email) {
          try {
            const cred = EmailAuthProvider.credential(email, "000000");
            await linkWithCredential(result.user, cred);
          } catch (e: any) {
            if (e.code !== "auth/provider-already-linked") throw e;
          }
        }
      })
      .catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);

      // Save FCM token for admin users
      if (user?.email) {
        const domain = user.email.toLowerCase().split("@")[1];
        if (domain?.startsWith("admin")) {
          saveAdminFCMToken(user);
        }
      }
    });

    return unsubscribe;
  }, []);

  /* =======================
     Context Value
  ======================= */

  const value: AuthContextType = {
    currentUser,
    loading,
    isConfigured: isFirebaseConfigured,
    login,
    loginWithGoogle,
    loginWithApple,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
