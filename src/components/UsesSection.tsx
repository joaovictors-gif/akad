import cashewJuice from "@/assets/cashew-juice.jpg";
import cashewNuts from "@/assets/cashew-nuts.jpg";

const uses = [
  {
    image: cashewJuice,
    title: "Suco de Caju",
    description:
      "O suco de caju é uma bebida refrescante e nutritiva, muito popular no Brasil, especialmente no Nordeste.",
  },
  {
    image: cashewNuts,
    title: "Castanha de Caju",
    description:
      "A castanha é um ingrediente versátil, usada em pratos doces e salgados, além de ser um snack saudável.",
  },
];

export const UsesSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <span className="text-accent font-semibold uppercase tracking-wider text-sm">
            Versatilidade
          </span>
          <h2 className="hero-text text-3xl md:text-5xl mt-2 text-foreground">
            Usos do Caju
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
            Do suco refrescante à castanha nutritiva, o caju oferece múltiplas formas de aproveitamento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {uses.map((use, index) => (
            <div
              key={use.title}
              className="group overflow-hidden rounded-2xl bg-card shadow-lg hover:shadow-2xl transition-all duration-500"
            >
              <div className="overflow-hidden">
                <img
                  src={use.image}
                  alt={use.title}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="p-8">
                <h3 className="font-display text-2xl font-semibold text-foreground mb-3">
                  {use.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {use.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
