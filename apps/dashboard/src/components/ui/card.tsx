import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-6 shadow-lg backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}
