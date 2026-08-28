import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder: string;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function SearchInput({ value, onChange, placeholder, disabled, className }: Props) {
  return (
    <label
      className={cn(
        "flex w-full max-w-md items-center gap-2 rounded-[var(--radius)] border border-border bg-card px-3 py-2 focus-within:ring-2 focus-within:ring-ring",
        className,
      )}
    >
      <Search className="size-4 text-muted-foreground" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={disabled}
        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed"
      />
    </label>
  );
}
