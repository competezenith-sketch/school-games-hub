import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface PhotoUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  disabled?: boolean;
}

const PhotoUpload = ({ value, onChange, folder = "general", disabled }: PhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Apenas imagens são permitidas.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB.");
        return;
      }

      setUploading(true);
      try {
        const ext = file.name.split(".").pop();
        const fileName = `${folder}/${Date.now()}.${ext}`;

        const { error } = await supabase.storage
          .from("athlete-photos")
          .upload(fileName, file, { upsert: true });

        if (error) throw error;

        const { data } = supabase.storage
          .from("athlete-photos")
          .getPublicUrl(fileName);

        onChange(data.publicUrl);
        toast.success("Foto enviada com sucesso!");
      } catch (err: any) {
        toast.error(err.message || "Erro ao enviar foto.");
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar preview */}
      <Avatar className="h-28 w-28 border-4 border-border shadow-md">
        <AvatarImage src={value || undefined} className="object-cover" />
        <AvatarFallback className="bg-muted">
          <User className="h-10 w-10 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={cn(
          "w-full max-w-xs flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors text-center",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground" />
        )}
        <p className="text-xs text-muted-foreground">
          {uploading ? "Enviando..." : "Arraste uma foto ou clique para selecionar"}
        </p>
        <p className="text-[10px] text-muted-foreground/60">JPG, PNG — máx. 5MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || uploading}
        />
      </div>

      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="text-destructive hover:text-destructive"
        >
          <X className="h-4 w-4 mr-1" />
          Remover foto
        </Button>
      )}
    </div>
  );
};

export default PhotoUpload;
