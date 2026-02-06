import cashewHero from "@/assets/cashew-hero.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={cashewHero}
          alt="Caju tropical"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-foreground/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <span 
          className="inline-block text-primary font-semibold uppercase tracking-widest text-sm mb-4 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          Descubra o sabor do Brasil
        </span>
        
        <h1 
          className="hero-text text-cream mb-6 animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          Caju
        </h1>
        
        <p 
          className="text-cream/90 text-xl md:text-2xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in"
          style={{ animationDelay: "0.6s" }}
        >
          A fruta tropical que encanta o mundo com seu sabor único, 
          sua castanha preciosa e seus inúmeros benefícios para a saúde.
        </p>

        <div 
          className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in"
          style={{ animationDelay: "0.8s" }}
        >
          <a href="#beneficios" className="btn-primary">
            Conheça os Benefícios
          </a>
          <a href="#usos" className="btn-secondary">
            Usos do Caju
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-cream/50 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-cream/70 rounded-full" />
        </div>
      </div>
    </section>
  );
};
