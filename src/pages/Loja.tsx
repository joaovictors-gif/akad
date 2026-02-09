import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Loader2, Package, ImageOff, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ProductFormModal } from "@/components/loja/ProductFormModal";

interface Product {
  id: string;
  productId?: string;
  nome: string;
  descricao?: string;
  valor: number;
  imageUrl?: string;
}

export default function Loja() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      const id = deletingProduct.id || deletingProduct.productId;
      const response = await fetch(`https://app-vaglvpp5la-uc.a.run.app/loja/delete/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao deletar produto");
      toast({ title: "Produto removido com sucesso!" });
      fetchProducts();
    } catch (error) {
      console.error("Erro:", error);
      toast({ title: "Erro ao remover produto", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeletingProduct(null);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://app-vaglvpp5la-uc.a.run.app/loja/list/");
      if (!response.ok) throw new Error("Erro ao buscar produtos");
      const data = await response.json();
      setProducts(data.produtos || []);
    } catch (error) {
      console.error("Erro:", error);
      toast({ title: "Erro ao carregar produtos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 overflow-auto">
        <AdminPageHeader
          title="Loja"
          onMenuClick={() => setSidebarOpen(true)}
          rightContent={
            <Button onClick={handleAdd} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Produto
            </Button>
          }
        />

        <main className="container mx-auto px-4 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-16 w-16 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Nenhum produto cadastrado</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Adicione seu primeiro produto à loja.</p>
              <Button onClick={handleAdd} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Produto
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden border-border/50 hover:shadow-md transition-shadow group">
                    <div className="relative aspect-square bg-muted/30">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 shadow-md"
                          onClick={() => handleEdit(product)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 shadow-md"
                          onClick={() => setDeletingProduct(product)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-1">
                      <h3 className="font-semibold text-foreground text-sm truncate">{product.nome}</h3>
                      {product.descricao && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{product.descricao}</p>
                      )}
                      <p className="text-primary font-bold text-base pt-1">{formatCurrency(product.valor)}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      <ProductFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        product={editingProduct}
        onSuccess={fetchProducts}
      />

      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{deletingProduct?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
