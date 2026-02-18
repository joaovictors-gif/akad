import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Loader2, Package, ImageOff, Trash2, ShoppingBag, Clock, CheckCircle, XCircle, PackageCheck } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ProductFormModal } from "@/components/loja/ProductFormModal";
import { collectionGroup, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { API_BASE } from "@/lib/api";

interface Product {
  id: string;
  productId?: string;
  nome: string;
  descricao?: string;
  valor: number;
  imageUrl?: string;
}

interface Pedido {
  id: string;
  path: string;
  alunoUid: string;
  alunoNome?: string;
  produtoNome: string;
  produtoValor: number;
  status: "pendente" | "confirmado" | "cancelado" | "entregue";
  criadoEm: string;
}

const statusConfig = {
  pendente: { label: "Pendente", icon: Clock, className: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30" },
  confirmado: { label: "Confirmado", icon: CheckCircle, className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  entregue: { label: "Entregue", icon: PackageCheck, className: "bg-primary/15 text-primary border-primary/30" },
  cancelado: { label: "Cancelado", icon: XCircle, className: "bg-destructive/15 text-destructive border-destructive/30" },
};

export default function Loja() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("produtos");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deliveringPedido, setDeliveringPedido] = useState<Pedido | null>(null);
  const [alunoNomes, setAlunoNomes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      const id = deletingProduct.id || deletingProduct.productId;
      const response = await fetch(`https://app-vaglvpp5la-uc.a.run.app/loja/delete/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao deletar produto");
      toast({ title: "Produto removido com sucesso!", variant: "success" });
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

  // Fetch pedidos from Firestore (collectionGroup)
  useEffect(() => {
    if (!db) {
      setLoadingPedidos(false);
      return;
    }
    const q = query(collectionGroup(db, "itens"), orderBy("criadoEm", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const items: Pedido[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        path: docSnap.ref.path,
        ...docSnap.data(),
      })) as Pedido[];
      setPedidos(items);
      setLoadingPedidos(false);

      // Fetch student names for unique UIDs not yet cached
      const uniqueUids = [...new Set(items.map(p => p.alunoUid).filter(Boolean))];
      const missing = uniqueUids.filter(uid => !alunoNomes[uid] && !items.find(p => p.alunoUid === uid && p.alunoNome));
      if (missing.length > 0) {
        const newNomes: Record<string, string> = {};
        await Promise.all(missing.map(async (uid) => {
          try {
            const inforSnap = await getDoc(doc(db!, `alunos/${uid}/infor/infor`));
            if (inforSnap.exists()) {
              newNomes[uid] = inforSnap.data().nome || uid.slice(0, 8);
            }
          } catch { /* ignore */ }
        }));
        setAlunoNomes(prev => ({ ...prev, ...newNomes }));
      }
    }, (error) => {
      console.error("Erro ao buscar pedidos:", error);
      setLoadingPedidos(false);
      toast({ title: "Erro ao carregar pedidos", description: "Verifique se o índice do Firestore foi criado.", variant: "destructive" });
    });
    return () => unsubscribe();
  }, []);

  const enviarNotificacaoPedido = async (uid: string, title: string, body: string) => {
    try {
      await fetch(`${API_BASE}/messaging/aviso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          mensagem: { title, body, link: "/aluno" },
        }),
      });
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
    }
  };

  const handleUpdateStatus = async (pedido: Pedido, newStatus: "confirmado" | "cancelado" | "entregue") => {
    setUpdatingStatus(pedido.id);
    try {
      const pedidoRef = doc(db!, pedido.path);

      if (newStatus === "cancelado") {
        await deleteDoc(pedidoRef);
        await enviarNotificacaoPedido(
          pedido.alunoUid,
          "❌ Pedido Cancelado",
          `Seu pedido de "${pedido.produtoNome}" foi cancelado pelo administrador.`
        );
        toast({ title: "Pedido cancelado e removido!", variant: "warning" });
      } else if (newStatus === "entregue") {
        await updateDoc(pedidoRef, { status: "entregue" });
        await enviarNotificacaoPedido(
          pedido.alunoUid,
          "📦 Pedido Entregue",
          `Seu pedido de "${pedido.produtoNome}" foi entregue!`
        );
        toast({ title: "Pedido marcado como entregue!", variant: "success" });
      } else {
        await updateDoc(pedidoRef, { status: "confirmado" });
        await enviarNotificacaoPedido(
          pedido.alunoUid,
          "✅ Pedido Confirmado",
          `Seu pedido de "${pedido.produtoNome}" foi confirmado!`
        );
        toast({ title: "Pedido confirmado!", variant: "success" });
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({ title: "Erro ao atualizar pedido", variant: "destructive" });
    } finally {
      setUpdatingStatus(null);
    }
  };

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
            activeTab === "produtos" ? (
              <Button onClick={handleAdd} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Produto
              </Button>
            ) : undefined
          }
        />

        <main className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-sm grid-cols-2 bg-muted/50">
              <TabsTrigger value="produtos" className="gap-2">
                <Package className="h-4 w-4" />
                Produtos
              </TabsTrigger>
              <TabsTrigger value="pedidos" className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Pedidos
                {pedidos.filter(p => p.status === "pendente").length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                    {pedidos.filter(p => p.status === "pendente").length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ===== PRODUTOS TAB ===== */}
            <TabsContent value="produtos">
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
            </TabsContent>

            {/* ===== PEDIDOS TAB ===== */}
            <TabsContent value="pedidos">
              {loadingPedidos ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pedidos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">Nenhum pedido ainda</h3>
                  <p className="text-sm text-muted-foreground mt-1">Os pedidos dos alunos aparecerão aqui.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pedidos.map((pedido, index) => {
                    const config = statusConfig[pedido.status] || statusConfig.pendente;
                    const StatusIcon = config.icon;
                    return (
                      <motion.div
                        key={pedido.id + pedido.path}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        <Card className="border-border/50">
                          <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-foreground truncate">{pedido.produtoNome}</p>
                                <p className="text-xs text-primary font-medium truncate">
                                  {pedido.alunoNome || alunoNomes[pedido.alunoUid] || pedido.alunoUid?.slice(0, 8)}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {new Date(pedido.criadoEm).toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-bold text-sm text-foreground hidden sm:block">{formatCurrency(pedido.produtoValor)}</span>
                              {pedido.status === "pendente" ? (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[11px] gap-1 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                                    onClick={() => handleUpdateStatus(pedido, "confirmado")}
                                    disabled={updatingStatus === pedido.id}
                                  >
                                    {updatingStatus === pedido.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                    <span className="hidden sm:inline">Confirmar</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[11px] gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                                    onClick={() => handleUpdateStatus(pedido, "cancelado")}
                                    disabled={updatingStatus === pedido.id}
                                  >
                                    <XCircle className="h-3 w-3" />
                                    <span className="hidden sm:inline">Cancelar</span>
                                  </Button>
                                </div>
                              ) : pedido.status === "confirmado" ? (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[11px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
                                    onClick={() => setDeliveringPedido(pedido)}
                                    disabled={updatingStatus === pedido.id}
                                  >
                                    {updatingStatus === pedido.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <PackageCheck className="h-3 w-3" />}
                                    <span className="hidden sm:inline">Entregar</span>
                                  </Button>
                                </div>
                              ) : (
                                <Badge variant="outline" className={`gap-1 text-[11px] ${config.className}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  <span className="hidden sm:inline">{config.label}</span>
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
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

      <AlertDialog open={!!deliveringPedido} onOpenChange={(open) => !open && setDeliveringPedido(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar entrega</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmar a entrega de "{deliveringPedido?.produtoNome}" para o aluno{" "}
              <span className="font-medium text-foreground">
                {deliveringPedido?.alunoNome || (deliveringPedido && alunoNomes[deliveringPedido.alunoUid]) || ""}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!updatingStatus}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!!updatingStatus}
              onClick={async () => {
                if (deliveringPedido) {
                  await handleUpdateStatus(deliveringPedido, "entregue");
                  setDeliveringPedido(null);
                }
              }}
            >
              {updatingStatus ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PackageCheck className="h-4 w-4 mr-2" />}
              Confirmar Entrega
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
