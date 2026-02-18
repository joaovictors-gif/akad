import { useState, useRef } from "react";
import { Camera, Loader2, Trash2, ImagePlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

interface ProfilePhotoUploadProps {
  userId: string;
  currentPhotoUrl?: string;
  userName: string;
  onPhotoUpdated: (newUrl: string) => void;
}

export function ProfilePhotoUpload({
  userId,
  currentPhotoUrl,
  userName,
  onPhotoUpdated,
}: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "??"
    );
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setUploading(true);

    try {
      if (!storage) throw new Error("Storage não configurado");

      const fileExtension = file.name.split(".").pop();
      const fileName = `profile-photos/${userId}/photo.${fileExtension}`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      if (db) {
        const docRef = doc(db, "alunos", userId, "infor", "infor");
        await updateDoc(docRef, { fotoUrl: downloadUrl });
      }

      onPhotoUpdated(downloadUrl);
      toast.success("Foto atualizada com sucesso!");
      setModalOpen(false);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao atualizar foto. Tente novamente.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentPhotoUrl) return;

    setRemoving(true);
    try {
      // Try to delete from storage
      if (storage) {
        try {
          const photoRef = ref(storage, `profile-photos/${userId}/photo.jpg`);
          await deleteObject(photoRef);
        } catch {
          // File might not exist or have different extension, continue
        }
      }

      if (db) {
        const docRef = doc(db, "alunos", userId, "infor", "infor");
        await updateDoc(docRef, { fotoUrl: "" });
      }

      onPhotoUpdated("");
      toast.success("Foto removida com sucesso!");
      setModalOpen(false);
    } catch (error) {
      console.error("Erro ao remover foto:", error);
      toast.error("Erro ao remover foto. Tente novamente.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="relative">
      <Avatar className="h-28 w-28 border-4 border-primary/20">
        <AvatarImage src={currentPhotoUrl} alt={userName} className="object-cover" />
        <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
          {getInitials(userName)}
        </AvatarFallback>
      </Avatar>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        size="icon"
        className="absolute bottom-0 right-0 h-9 w-9 rounded-full shadow-lg"
        variant="secondary"
        onClick={() => setModalOpen(true)}
        disabled={uploading || removing}
      >
        {uploading || removing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </Button>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Foto de perfil</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || removing}
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImagePlus className="h-5 w-5 text-primary" />
              )}
              Escolher nova foto
            </Button>

            {currentPhotoUrl && (
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={handleRemovePhoto}
                disabled={uploading || removing}
              >
                {removing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
                Remover foto
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
