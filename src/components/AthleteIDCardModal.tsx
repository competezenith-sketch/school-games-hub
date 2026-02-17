import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, CreditCard, Loader2 } from "lucide-react";
import AthleteIDCard from "@/components/AthleteIDCard";
import { toast } from "sonner";

interface AthleteIDCardModalProps {
  athleteId: string;
  fullName: string;
  photoUrl?: string | null;
  role: string;
  modality?: string;
  delegation?: string;
  sex?: string | null;
  trigger?: React.ReactNode;
}

const AthleteIDCardModal = ({
  trigger,
  ...cardProps
}: AthleteIDCardModalProps) => {
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPng = async () => {
    const cardEl = cardContainerRef.current?.querySelector("[data-card-ref]") as HTMLElement | null;
    if (!cardEl) return;

    setDownloading(true);
    try {
      const dataUrl = await toPng(cardEl, {
        pixelRatio: 3,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `carteirinha-${cardProps.fullName.replace(/\s+/g, "_").toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Carteirinha baixada!");
    } catch (err) {
      toast.error("Erro ao gerar imagem. Tente novamente.");
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <CreditCard className="h-4 w-4 mr-2" />
            Carteirinha
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider">Carteirinha do Participante</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-4">
          <div ref={cardContainerRef}>
            <AthleteIDCard {...cardProps} />
          </div>
          <Button onClick={handleDownloadPng} disabled={downloading} className="w-full max-w-[340px]">
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {downloading ? "Gerando..." : "Baixar PNG"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AthleteIDCardModal;
