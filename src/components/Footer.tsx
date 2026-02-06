export const Footer = () => {
  return (
    <footer className="bg-foreground py-12 px-6">
      <div className="container mx-auto max-w-6xl text-center">
        <h3 className="font-display text-2xl text-background mb-2">Caju</h3>
        <p className="text-background/60 mb-6">
          O tesouro tropical do Brasil
        </p>
        <div className="w-16 h-0.5 bg-primary mx-auto mb-6" />
        <p className="text-background/40 text-sm">
          © {new Date().getFullYear()} Site sobre Caju. Feito com amor pelo Brasil.
        </p>
      </div>
    </footer>
  );
};
