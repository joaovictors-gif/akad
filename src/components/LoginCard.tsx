import { useState } from "react";
import { Mail, Lock, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

const LoginCard = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const { login, loginWithGoogle, loginWithApple, isConfigured } = useAuth();
  const navigate = useNavigate();

  // Detectar se é iOS e se está rodando como PWA
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator as any).standalone === true;
  const isIOSBrowser = isIOS && !isPWA;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConfigured) {
      toast.error("Firebase não está configurado");
      return;
    }
    
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    // Verificar se é aluno no iPhone via navegador
    const domain = email.toLowerCase().split("@")[1];
    const isAdmin = domain?.startsWith("admin") ?? false;
    
    if (!isAdmin && isIOSBrowser) {
      toast.error("Para receber notificações, instale o app primeiro. Toque em 'Compartilhar' e depois 'Adicionar à Tela de Início'");
      return;
    }

    setIsLoading(true);
    
    try {
      await login(email, password);
      toast.success("Login realizado com sucesso!");
      
      if (isAdmin) {
        navigate("/dashboard");
      } else {
        navigate("/aluno/notificacoes");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === "auth/invalid-credential") {
        toast.error("Email ou senha incorretos");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("Muitas tentativas. Tente novamente mais tarde");
      } else {
        toast.error("Erro ao fazer login. Tente novamente");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isConfigured) {
      toast.error("Firebase não está configurado");
      return;
    }

    // Bloquear login Google no iPhone via navegador (alunos não podem usar)
    if (isIOSBrowser) {
      toast.error("Para receber notificações, instale o app primeiro. Toque em 'Compartilhar' e depois 'Adicionar à Tela de Início'");
      return;
    }

    setIsGoogleLoading(true);

    try {
      const result = await loginWithGoogle();
      
      if (result.success) {
        toast.success("Login realizado com sucesso!");
        
        if (result.isAdmin) {
          navigate("/dashboard");
        } else {
          navigate("/aluno/notificacoes");
        }
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      
      if (error.code === "auth/popup-closed-by-user") {
        toast.error("Login cancelado");
      } else if (error.code === "auth/popup-blocked") {
        toast.error("Pop-up bloqueado. Permita pop-ups para continuar");
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao fazer login com Google");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };
  const handleAppleLogin = async () => {
  if (!isConfigured) {
    toast.error("Firebase não está configurado");
    return;
  }

  // Apple só faz sentido no iOS / Safari
  if (!isIOS) {
    toast.error("Login com Apple disponível apenas em dispositivos Apple");
    return;
  }

  try {
    setIsAppleLoading(true);
    await loginWithApple(); // redirect
  } catch (error: any) {
    console.error("Apple login error:", error);
    toast.error("Erro ao fazer login com Apple");
    setIsAppleLoading(false);
  }
};


return (
    <div className="w-full max-w-md mx-4 animate-fade-in-up">
      {/* Logo and Title */}
      <div className="text-center mb-6 md:mb-10">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-wider text-gradient mb-2">
          AKAD
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm font-medium tracking-wide">
          ADRIANO KARATE-DO
        </p>
      </div>

      {/* Card */}
      <div className="glass rounded-2xl md:rounded-3xl p-5 md:p-10 shadow-2xl">
        {/* Renderização Condicional: Se for iOS Browser, mostra APENAS a instrução */}
        {isIOSBrowser ? (
          <div className="text-center py-2">
            <div className="mb-4 flex justify-center">
              <div className="p-3 bg-primary/20 rounded-full">
                <svg viewBox="0 0 24 24" className="w-10 h-10 fill-primary">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-foreground mb-3">
              Instalação Necessária
            </h2>
            
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl text-left">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Para acessar sua conta e receber notificações no iOS, instale o Web App:
              </p>
              <ol className="mt-3 space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">1</span>
                  <span>Toque em <strong className="text-foreground">Compartilhar</strong> (quadrado com seta).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">2</span>
                  <span>Toque em <strong className="text-foreground">"Adicionar à Tela de Início"</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">3</span>
                  <span>Abra o app pelo ícone criado.</span>
                </li>
              </ol>
            </div>
          </div>
        ) : (
          /* Caso contrário, mostra o formulário de Login normal */
          <>
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">
              Bem-vindo de volta
            </h2>
            <p className="text-muted-foreground text-xs md:text-sm mb-5 md:mb-8">
              Entre com suas credenciais para continuar
            </p>

            {!isConfigured && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-300/90">
                  Firebase não configurado.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campos de Email e Senha */}
              <div className="space-y-1.5">
                <label className="block text-xs md:text-sm font-medium text-foreground/80">E-mail</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-3 py-3 bg-muted/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs md:text-sm font-medium text-foreground/80">Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-10 py-3 bg-muted/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isConfigured}
                className="w-full py-3 mt-1 bg-primary hover:bg-primary/90 rounded-xl text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" /> : "Entrar"}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50"></div></div>
                <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">ou</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={handleGoogleLogin} disabled={isGoogleLoading} className="py-3 bg-muted/50 border border-border/50 rounded-xl flex justify-center hover:bg-muted/70 transition-colors disabled:opacity-50">
                  {isGoogleLoading ? <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" /> : <GoogleIcon />}
                </button>
                <button type="button" onClick={handleAppleLogin} disabled={isAppleLoading} className="py-3 bg-muted/50 border border-border/50 rounded-xl flex justify-center hover:bg-muted/70 transition-colors disabled:opacity-50">
                  {isAppleLoading ? <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" /> : <AppleIcon />}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <p className="text-center text-muted-foreground/60 text-[10px] md:text-xs mt-4 md:mt-8">
        © 2026 AKAD. Todos os direitos reservados.
      </p>
    </div>
  );
};


export default LoginCard;
