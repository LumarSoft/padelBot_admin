import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";

/**
 * WhatsApp-branded CTA link: official glyph over the brand green, styled like
 * our default button (gradient + specular edge). One component so every
 * "escribinos por WhatsApp" action looks the same.
 */
export function WhatsAppLink({
  className,
  children,
  ...props
}: ComponentProps<"a">) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-linear-to-b from-[#27b03f] to-[#1a9432] px-3.5 py-2 text-sm font-medium whitespace-nowrap text-white shadow-[inset_0_1px_0_0_--alpha(var(--color-white)/25%),0_1px_2px_--alpha(var(--color-black)/12%)] transition-all duration-200 ease-fluid outline-none select-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-[#27b03f]/50 active:scale-[0.97] [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      <WhatsAppIcon />
      {children}
    </a>
  );
}
