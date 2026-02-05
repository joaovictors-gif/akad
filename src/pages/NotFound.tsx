import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-900 via-slate-900 to-neutral-950 px-6">
      <div className="max-w-md text-center text-white">
        {/* Número 404 */}
        <h1 className="text-[120px] font-extrabold leading-none tracking-tight opacity-90 text-zinc-100">404</h1>

        {/* Título */}
        <h2 className="mt-4 text-2xl font-semibold text-zinc-200">Página não encontrada</h2>

        {/* Descrição */}
        <p className="mt-2 text-sm text-zinc-400">
          A rota <span className="font-mono text-zinc-300">{location.pathname}</span> não existe ou foi movida.
        </p>

        {/* Botão */}
        <button
          onClick={() => navigate("/")}
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-900 shadow-lg transition-all duration-200 hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          Voltar para o início
        </button>

        {/* Branding */}
        <p className="mt-10 text-xs text-zinc-500 opacity-80">© {new Date().getFullYear()} AKAD</p>
      </div>
    </div>
  );
};

export default NotFound;
