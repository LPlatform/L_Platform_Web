import { cn } from "@/lib/utils";

const PALETTE = [
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
];

function colorFor(name: string): string {
  const hash = name.split("").reduce((total, character) => total + character.charCodeAt(0), 0);
  return PALETTE[hash % PALETTE.length] ?? PALETTE[0]!;
}

export function UserAvatar({
  firstName,
  lastName,
  className,
  size = "md",
}: {
  firstName: string;
  lastName: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const name = `${firstName} ${lastName}`.trim();
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        size === "sm" && "size-7 text-[10px]",
        size === "md" && "size-9 text-xs",
        size === "lg" && "size-12 text-sm",
        colorFor(name),
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
