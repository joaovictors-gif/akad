import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import student1 from "@/assets/testimonials/student-1.jpg";
import student2 from "@/assets/testimonials/student-2.jpg";
import student3 from "@/assets/testimonials/student-3.jpg";

const testimonials = [
  {
    name: "Lucas Oliveira",
    age: "10 anos",
    belt: "Faixa Amarela",
    photo: student1,
    quote:
      "O karatê me ensinou a ter mais concentração na escola e respeito com os outros. Adoro os treinos!",
  },
  {
    name: "Mariana Santos",
    age: "15 anos",
    belt: "Faixa Verde",
    photo: student2,
    quote:
      "Comecei tímida e hoje sou outra pessoa. A AKAD me deu confiança e disciplina pra vida toda.",
  },
  {
    name: "Rafael Costa",
    age: "35 anos",
    belt: "Faixa Marrom",
    photo: student3,
    quote:
      "Treino há 5 anos e cada dia é uma superação. O Sensei Adriano é um mestre que inspira pelo exemplo.",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-3 block">
            Depoimentos
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
            O que nossos alunos dizem
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-lg">
            Histórias reais de transformação através do karatê.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="relative p-8 rounded-3xl bg-card border border-border hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              <Quote className="w-8 h-8 text-primary/20 mb-4" />
              <p className="text-foreground/80 leading-relaxed mb-6 italic">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-4">
                <img
                  src={t.photo}
                  alt={t.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                  loading="lazy"
                />
                <div>
                  <p className="font-bold text-foreground">{t.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t.belt} · {t.age}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
