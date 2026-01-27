/**
 * ClaseBadge.tsx
 * Badge reutilizable para mostrar clases en el calendario
 */

import { Clase } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ESTADO_STYLES } from "./calendar.styles";

interface ClaseBadgeProps {
  clase: Clase;
  alumnoNombre: string;
  caballoNombre?: string;
  compact?: boolean;
  onClick?: () => void;
}

export function ClaseBadge({
  clase,
  alumnoNombre,
  caballoNombre,
  compact = false,
  onClick,
}: ClaseBadgeProps) {
  return (
    <button
      className={cn(
        "w-full rounded-md px-2 py-1 text-left text-xs transition-all",
        compact ? "py-1" : "py-1.5",
        ESTADO_STYLES[clase.estado],
        onClick && "cursor-pointer hover:scale-105",
      )}
      onClick={onClick}
    >
      <div className={cn("truncate", compact && "flex items-center gap-1")}>
        {/* Indicadores visuales para ACA/ASA */}
        {clase.estado === "ACA" && <span className="mr-1">🔵</span>}
        {clase.estado === "ASA" && <span className="mr-1">🟡</span>}

        {compact ? (
          <>
            <span className="font-medium">{clase.hora.slice(0, 5)}</span>
            <span className="truncate">{alumnoNombre.split(" ")[0]}</span>
            {caballoNombre && (
              <>
                <span>/</span>
                <span className="truncate">{caballoNombre.split(" ")[0]}</span>
              </>
            )}
          </>
        ) : (
          <span>{alumnoNombre}</span>
        )}
      </div>
    </button>
  );
}
