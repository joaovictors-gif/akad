import { MapPin, Calendar, TreeDeciduous } from "lucide-react";

const facts = [
  {
    icon: MapPin,
    label: "Origem",
    value: "Nordeste do Brasil",
  },
  {
    icon: Calendar,
    label: "Safra",
    value: "Agosto a Janeiro",
  },
  {
    icon: TreeDeciduous,
    label: "Árvore",
    value: "Cajueiro",
  },
];

export const FactsSection = () => {
  return (
    <section className="section-padding bg-secondary">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="hero-text text-3xl md:text-4xl text-secondary-foreground">
            Curiosidades
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="flex items-center gap-6 bg-secondary-foreground/10 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="w-14 h-14 rounded-full bg-secondary-foreground/20 flex items-center justify-center flex-shrink-0">
                <fact.icon className="w-7 h-7 text-secondary-foreground" />
              </div>
              <div>
                <span className="text-secondary-foreground/70 text-sm uppercase tracking-wide">
                  {fact.label}
                </span>
                <p className="text-secondary-foreground font-display text-xl font-semibold">
                  {fact.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-secondary-foreground/90 text-lg max-w-3xl mx-auto leading-relaxed">
            O cajueiro é uma árvore nativa do Brasil, conhecida mundialmente pela sua castanha. 
            Curiosamente, o que chamamos de "fruta" é na verdade um pseudofruto — a verdadeira fruta é a castanha!
          </p>
        </div>
      </div>
    </section>
  );
};
