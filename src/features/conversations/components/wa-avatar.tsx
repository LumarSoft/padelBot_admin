import { cn } from "@/lib/utils";

/**
 * WhatsApp's default profile picture — the grey silhouette every contact without a photo gets.
 * The API has no player photos, so every chat shows this one, as WhatsApp would.
 */
export function WaAvatar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 212 212"
      aria-hidden
      className={cn("size-12 shrink-0 rounded-full", className)}
    >
      <circle cx="106" cy="106" r="106" className="fill-[#dfe5e7] dark:fill-[#6a7175]" />
      <circle cx="106" cy="84" r="40" className="fill-white dark:fill-[#cfd4d6]" />
      <path
        d="M106 138c-37 0-68 19-79 47a106 106 0 0 0 158 0c-11-28-42-47-79-47z"
        className="fill-white dark:fill-[#cfd4d6]"
      />
    </svg>
  );
}
