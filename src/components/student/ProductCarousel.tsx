import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ImageOff, Loader2, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface Product {
  id: string;
  productId?: string;
  nome: string;
  descricao?: string;
  valor: number;
  imageUrl?: string;
}

export function ProductCarousel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", slidesToScroll: 1 },
    [Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("https://app-vaglvpp5la-uc.a.run.app/loja/list/");
        if (!response.ok) throw new Error("Erro");
        const data = await response.json();
        setProducts(data.produtos || []);
      } catch {
        console.error("Erro ao buscar produtos da loja");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handleBuy = (product: Product) => {
    toast({
      title: "Em breve!",
      description: `A compra de "${product.nome}" estará disponível em breve.`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Loja</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={scrollPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={scrollNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {products.map((product) => (
            <div key={product.id} className="flex-[0_0_70%] min-w-0 sm:flex-[0_0_45%]">
              <Card className="overflow-hidden border-border/50 bg-gradient-to-b from-card to-card/80 shadow-md">
                <div className="aspect-[4/3] bg-muted/20 relative overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.nome}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10">
                      <ImageOff className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  )}
                  {/* Badge Popular */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                    <Flame className="h-3 w-3" />
                    Popular
                  </div>
                </div>
                <CardContent className="p-3 space-y-1.5">
                  <h4 className="font-bold text-foreground text-sm truncate">{product.nome}</h4>
                  {product.descricao && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{product.descricao}</p>
                  )}
                  <div className="flex items-center justify-between pt-1.5 border-t border-border/30">
                    <span className="text-primary font-extrabold text-base">{formatCurrency(product.valor)}</span>
                    <Button size="sm" className="h-7 gap-1 text-[11px] rounded-full px-3" onClick={() => handleBuy(product)}>
                      <ShoppingBag className="h-3 w-3" />
                      Comprar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
