import LoginForm from "@/components/LoginForm";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            akad
          </h1>
          <p className="text-muted-foreground mt-2">
            Bem-vindo de volta
          </p>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          © 2025 akad. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default Index;
