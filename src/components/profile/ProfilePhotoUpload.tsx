import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setUploading(true);

    try {
      if (!storage) {
        throw new Error("Storage não configurado");
      }

      // Create unique filename
      const fileExtension = file.name.split(".").pop();
      const fileName = `profile-photos/${userId}/photo.${fileExtension}`;
      const storageRef = ref(storage, fileName);

      // Upload file
      await uploadBytes(storageRef, file);

      // Get download URL
      const downloadUrl = await getDownloadURL(storageRef);

      // Update Firestore document
      if (db) {
        const docRef = doc(db, "alunos", userId, "infor", "infor");
        await updateDoc(docRef, { fotoUrl: downloadUrl });
      }

      onPhotoUpdated(downloadUrl);
      toast.success("Foto atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao atualizar foto. Tente novamente.");
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      <Avatar className="h-28 w-28 border-4 border-primary/20">
        <AvatarImage 
          src={currentPhotoUrl} 
          alt={userName} 
          className="object-cover"
        />
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
        onClick={handleButtonClick}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
