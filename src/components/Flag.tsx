import { cn } from "@/lib/utils"

interface FlagProps {
  /** Código do flag-icons: "br", "gb-eng", "xk"... */
  code: string
  className?: string
}

export function Flag({ code, className }: FlagProps) {
  return (
    <span
      role="img"
      aria-label="Bandeira"
      className={cn(
        "fib block aspect-[4/3] w-full rounded-md shadow-sm ring-1 ring-black/10",
        `fi-${code}`,
        className,
      )}
    />
  )
}
