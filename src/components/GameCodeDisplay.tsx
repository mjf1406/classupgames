import { formatCode } from "@/lib/game";
import { cn } from "@/lib/utils";

type GameCodeDisplayProps = {
  code: string;
  size?: "md" | "lg" | "xl";
  className?: string;
};

const sizeClasses = {
  md: "text-2xl tracking-[0.3em]",
  lg: "text-4xl tracking-[0.35em]",
  xl: "text-5xl tracking-[0.4em] sm:text-6xl",
};

export function GameCodeDisplay({
  code,
  size = "lg",
  className,
}: GameCodeDisplayProps) {
  return (
    <p
      className={cn(
        "font-mono font-semibold text-foreground",
        sizeClasses[size],
        className,
      )}
      aria-label={`Join code ${code}`}
    >
      {formatCode(code)}
    </p>
  );
}
