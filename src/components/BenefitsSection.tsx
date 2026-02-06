import { Leaf, Droplets, Heart, Sun } from "lucide-react";

const benefits = [
  {
    icon: Heart,
    title: "Rico em Vitamina C",
    description: "Uma das maiores fontes naturais de vitamina C, fortalecendo o sistema imunológico.",
  },
  {
    icon: Droplets,
    title: "Hidratante Natural",
    description: "Alto teor de água e nutrientes que mantêm o corpo hidratado e saudável.",
  },
  {
    icon: Leaf,
    title: "Antioxidantes",
    description: "Combate os radicais livres, ajudando a prevenir o envelhecimento precoce.",
  },
  {
    icon: Sun,
    title: "Energia Natural",
    description: "Fonte de carboidratos e minerais que fornecem energia de forma natural.",
  },
];

export const BenefitsSection = () => {
  return (
    <section className="section-padding bg-muted/50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <span className="text-secondary font-semibold uppercase tracking-wider text-sm">
            Saúde & Bem-estar
          </span>
          <h2 className="hero-text text-3xl md:text-5xl mt-2 text-foreground">
            Benefícios do Caju
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
            Descubra por que o caju é considerado uma das frutas mais nutritivas do Brasil.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="card-tropical text-center group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <benefit.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
