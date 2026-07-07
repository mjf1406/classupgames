import { Anchor, Battery, Bot, Waves } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type GameVisualProps = {
  progress: number;
  lives: number;
  maxLives: number;
  resourceLabel: string;
  className?: string;
};

function ResourceMeter({
  lives,
  maxLives,
  label,
  icon,
  className,
}: {
  lives: number;
  maxLives: number;
  label: string;
  icon: React.ReactNode;
  className?: string;
}) {
  const percent = Math.max(0, Math.min(100, (lives / maxLives) * 100));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium">
          {icon}
          {label}
        </span>
        <span className="font-mono text-muted-foreground">
          {lives}/{maxLives}
        </span>
      </div>
      <Progress value={percent} className="h-2" />
    </div>
  );
}

export function SubmarineGame({
  progress,
  lives,
  maxLives,
  resourceLabel,
  className,
}: GameVisualProps) {
  const depth = Math.min(100, Math.max(0, progress));

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-b from-sky-200/80 via-blue-500/40 to-blue-950 p-6 dark:from-sky-950/50 dark:via-blue-950 dark:to-slate-950",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <Waves className="absolute right-4 top-4 size-16 text-white/40" />
        <Waves className="absolute bottom-8 left-6 size-24 text-white/20" />
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-white/70">
              Depth progress
            </p>
            <p className="font-mono text-2xl font-bold text-white">
              {Math.round(depth)}%
            </p>
          </div>
          <Anchor className="size-8 text-white/80" />
        </div>

        <div className="relative h-48 overflow-hidden rounded-xl bg-blue-950/50 ring-1 ring-white/10">
          <div
            className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-sky-300/20 to-blue-900/60 transition-transform duration-700 ease-out"
            style={{ transform: `translateY(${100 - depth}%)` }}
          />
          <div
            className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center transition-all duration-700 ease-out"
            style={{ top: `${Math.min(85, 10 + depth * 0.75)}%` }}
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-yellow-400 shadow-lg ring-4 ring-yellow-200/50">
              <Anchor className="size-7 text-blue-900" />
            </div>
          </div>
          <div className="absolute bottom-3 left-3 rounded-md bg-black/30 px-2 py-1 text-xs text-white/80">
            Goal: ocean floor
          </div>
        </div>

        <ResourceMeter
          lives={lives}
          maxLives={maxLives}
          label={resourceLabel}
          icon={<Waves className="size-4" />}
        />
      </div>
    </div>
  );
}

export function RobotGame({
  progress,
  lives,
  maxLives,
  resourceLabel,
  className,
}: GameVisualProps) {
  const distance = Math.min(100, Math.max(0, progress));

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 p-6 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950",
        className,
      )}
    >
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Track progress
            </p>
            <p className="font-mono text-2xl font-bold">{Math.round(distance)}%</p>
          </div>
          <Bot className="size-8 text-primary" />
        </div>

        <div className="relative h-48 overflow-hidden rounded-xl bg-muted/50 ring-1 ring-border">
          <div className="absolute inset-x-4 top-1/2 h-2 -translate-y-1/2 rounded-full bg-border" />
          <div
            className="absolute left-4 top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `calc(${distance}% - 2rem)` }}
          />
          <div
            className="absolute top-1/2 flex -translate-y-1/2 transition-all duration-700 ease-out"
            style={{ left: `calc(${Math.max(4, distance)}% - 1.5rem)` }}
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
              <Bot className="size-6" />
            </div>
          </div>
          <div className="absolute bottom-3 right-3 rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground">
            Finish line
          </div>
        </div>

        <ResourceMeter
          lives={lives}
          maxLives={maxLives}
          label={resourceLabel}
          icon={<Battery className="size-4" />}
        />
      </div>
    </div>
  );
}
