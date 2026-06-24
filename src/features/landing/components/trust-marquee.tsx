import {
  MessageCircle,
  CreditCard,
  Bot,
  Radio,
  LayoutGrid,
  ShieldCheck,
  Wallet,
  Clock,
} from "lucide-react";

const ITEMS = [
  { icon: MessageCircle, label: "WhatsApp Business" },
  { icon: CreditCard, label: "MercadoPago" },
  { icon: Bot, label: "Atención con IA" },
  { icon: Radio, label: "Tiempo real" },
  { icon: LayoutGrid, label: "Multi-cancha" },
  { icon: ShieldCheck, label: "Sin turnos pisados" },
  { icon: Wallet, label: "Conciliación automática" },
  { icon: Clock, label: "Disponible 24/7" },
];

function MarqueeGroup({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div
      aria-hidden={ariaHidden || undefined}
      className="flex shrink-0 items-center gap-3 pr-3"
    >
      {ITEMS.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className="text-muted-foreground inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2 text-sm font-medium whitespace-nowrap"
        >
          <Icon className="text-brand size-4" />
          {label}
        </span>
      ))}
    </div>
  );
}

export function TrustMarquee() {
  return (
    <section className="border-y border-border/60 py-8">
      <p className="text-muted-foreground mb-6 text-center text-sm">
        Todo lo que tu complejo necesita, en una sola herramienta
      </p>
      <div className="marquee-row group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="animate-marquee flex w-max">
          <MarqueeGroup />
          <MarqueeGroup ariaHidden />
        </div>
      </div>
    </section>
  );
}
