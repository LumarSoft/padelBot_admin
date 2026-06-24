"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Container } from "./landing-ui";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface Metric {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

const METRICS: Metric[] = [
  { value: 24, suffix: "/7", label: "El bot atiende, sin pausas ni feriados" },
  { value: 15, prefix: "~", suffix: " min", label: "Para dejarlo funcionando" },
  { value: 100, suffix: "%", label: "De los pagos, conciliados solos" },
  { value: 0, label: "Turnos pisados, garantizado" },
];

export function MetricsBand() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const nodes = gsap.utils.toArray<HTMLElement>(
          ".metric-value",
          scope.current,
        );
        nodes.forEach((node) => {
          const value = Number(node.dataset.value);
          const prefix = node.dataset.prefix ?? "";
          const suffix = node.dataset.suffix ?? "";
          const counter = { v: 0 };
          gsap.to(counter, {
            v: value,
            duration: 1.6,
            ease: "power2.out",
            scrollTrigger: { trigger: node, start: "top 85%", once: true },
            onUpdate: () => {
              node.textContent = `${prefix}${Math.round(counter.v)}${suffix}`;
            },
          });
        });
      });
    },
    { scope },
  );

  return (
    <section className="border-t border-border/60 py-16">
      <Container>
        <div
          ref={scope}
          className="relative overflow-hidden rounded-3xl border border-border bg-[radial-gradient(120%_140%_at_0%_0%,color-mix(in_oklch,var(--brand)_14%,transparent),transparent_55%)] px-6 py-12 sm:px-10"
        >
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {METRICS.map((metric) => (
              <div key={metric.label} className="flex flex-col gap-2">
                <span
                  className="metric-value text-brand text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl"
                  data-value={metric.value}
                  data-prefix={metric.prefix ?? ""}
                  data-suffix={metric.suffix ?? ""}
                >
                  {metric.prefix ?? ""}
                  {metric.value}
                  {metric.suffix ?? ""}
                </span>
                <span className="text-muted-foreground text-sm text-pretty">
                  {metric.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
