import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Loader2, Package } from "lucide-react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id?: string;
  productId?: string;
  nome: string;
  descricao?: string;
  valor: number;
  imageUrl?: string;
}

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess: () => void;
}

export function ProductFormModal({ open, onOpenChange, product, onSuccess }: ProductFormModalProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isEditing = !!product;

  useEffect(() => {
    if (product) {
      setNome(product.nome || "");
      setDescricao(product.descricao || "");
      setValor(String(product.valor || ""));
      setImagePreview(product.imageUrl || null);
      setImageFile(null);
    } else {
      setNome("");
      setDescricao("");
      setValor("");
      setImagePreview(null);
      setImageFile(null);
    }
  }, [product, open]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !valor.trim()) {
      toast({ title: "Preencha o nome e o valor do produto", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      let imageUrl = product?.imageUrl || "";
      const productId = product?.id || product?.productId || `prod_${Date.now()}`;

      if (imageFile && storage) {
        // Apagar imagem anterior do Storage se existir
        if (isEditing && product?.imageUrl) {
          try {
            const oldRef = ref(storage, product.imageUrl);
            const { deleteObject } = await import("firebase/storage");
            await deleteObject(oldRef);
          } catch (err) {
            console.warn("Não foi possível apagar imagem anterior:", err);
          }
        }

        const storageRef = ref(storage, `produtos/${productId}/${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      if (isEditing) {
        const response = await fetch(`https://app-vaglvpp5la-uc.a.run.app/loja/edit/${product.id || product.productId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: nome.trim(),
            descricao: descricao.trim(),
            valor: parseFloat(valor),
            imageUrl,
          }),
        });
        if (!response.ok) throw new Error("Erro ao editar produto");
        toast({ title: "Produto atualizado com sucesso!", variant: "success" });
      } else {
        const response = await fetch("https://app-vaglvpp5la-uc.a.run.app/loja/add/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            nome: nome.trim(),
            descricao: descricao.trim(),
            valor: parseFloat(valor),
            imageUrl,
          }),
        });
        if (!response.ok) throw new Error("Erro ao adicionar produto");
        toast({ title: "Produto adicionado com sucesso!", variant: "success" });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: isEditing ? "Erro ao editar produto" : "Erro ao adicionar produto",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Produto" : "Adicionar Produto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do produto</Label>
            <Input id="nome" placeholder="Ex: Kimono Adulto" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" placeholder="Descrição do produto..." value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={500} rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input id="valor" type="number" step="0.01" min="0" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Imagem do produto</Label>
            {imagePreview ? (
              <div className="relative w-full max-w-xs">
                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-xl border border-border" />
                <button type="button" onClick={removeImage} className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground shadow-md hover:opacity-90 transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full max-w-xs h-40 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Upload className="h-8 w-8" />
                <span className="text-sm font-medium">Selecionar imagem</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? "Salvando..." : "Adicionando..."}
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                {isEditing ? "Salvar Alterações" : "Adicionar Produto"}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
