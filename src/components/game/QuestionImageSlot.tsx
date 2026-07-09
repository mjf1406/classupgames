import { cn } from "@/lib/utils";

type QuestionImageSlotProps = {
  imageUrl?: string | null;
  alt?: string;
  className?: string;
};

export function QuestionImageSlot({
  imageUrl,
  alt,
  className,
}: QuestionImageSlotProps) {
  if (!imageUrl) {
    return <div className={cn("min-h-0", className)} aria-hidden />;
  }

  return (
    <div
      className={cn("flex min-h-0 items-center justify-center py-4", className)}
    >
      <img
        src={imageUrl}
        alt={alt ?? "Question image"}
        className="max-h-full max-w-full rounded-lg object-contain"
      />
    </div>
  );
}
