import { useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { User } from "lucide-react";

interface AthleteIDCardProps {
  athleteId: string;
  fullName: string;
  photoUrl?: string | null;
  role: string;
  modality?: string;
  delegation?: string;
  sex?: string | null;
}

const roleLabels: Record<string, string> = {
  atleta: "ATLETA",
  tecnico: "TÉCNICO",
  dirigente: "DIRIGENTE",
  motorista: "MOTORISTA",
  arbitro: "ÁRBITRO",
};

const AthleteIDCard = ({
  athleteId,
  fullName,
  photoUrl,
  role,
  modality,
  delegation,
  sex,
}: AthleteIDCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const verifyUrl = `https://zenithcompete.lovable.app/verify/${athleteId}`;

  return (
    <div
      ref={cardRef}
      data-card-ref
      className="relative w-[340px] h-[215px] rounded-2xl overflow-hidden shadow-xl select-none"
      style={{
        background: "linear-gradient(135deg, hsl(153 100% 33%) 0%, hsl(222 47% 11%) 100%)",
      }}
    >
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
        <span className="font-display text-[80px] font-bold tracking-widest text-white rotate-[-15deg]">
          JER
        </span>
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-white/20 flex items-center justify-center">
            <span className="font-display text-[10px] font-bold text-white">JER</span>
          </div>
          <span className="text-[10px] text-white/60 uppercase tracking-widest">
            Jogos Escolares 2026
          </span>
        </div>
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{
            background: "hsla(48, 100%, 50%, 0.25)",
            color: "hsl(48, 100%, 70%)",
          }}
        >
          {roleLabels[role] || role.toUpperCase()}
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 flex gap-4 px-4 pt-1">
        {/* Photo */}
        <div className="shrink-0">
          <div className="h-[100px] w-[100px] rounded-xl overflow-hidden border-2 border-white/20 bg-white/10">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={fullName}
                className="h-full w-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <User className="h-10 w-10 text-white/30" />
              </div>
            )}
          </div>
        </div>

        {/* Info + QR */}
        <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
          <div className="space-y-1.5">
            <h3
              className="text-white font-bold text-sm leading-tight truncate"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              title={fullName}
            >
              {fullName}
            </h3>
            {delegation && (
              <p className="text-white/70 text-[11px] truncate">{delegation}</p>
            )}
            {modality && (
              <p className="text-white/50 text-[10px] uppercase tracking-wide truncate">
                {modality}
              </p>
            )}
            {sex && (
              <p className="text-white/40 text-[10px]">
                {sex === "M" ? "Masculino" : "Feminino"}
              </p>
            )}
          </div>
        </div>

        {/* QR Code */}
        <div className="shrink-0 flex flex-col items-center gap-1 pt-1">
          <div className="bg-white rounded-lg p-1.5">
            <QRCodeSVG value={verifyUrl} size={64} level="M" />
          </div>
          <span className="text-[7px] text-white/30 tracking-wider">VERIFICAR</span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2">
        <span className="text-[8px] text-white/25 tracking-wider uppercase">
          ID: {athleteId.slice(0, 8)}
        </span>
        <span className="text-[8px] text-white/25 tracking-wider">
          Zenith Compete
        </span>
      </div>
    </div>
  );
};

export default AthleteIDCard;
