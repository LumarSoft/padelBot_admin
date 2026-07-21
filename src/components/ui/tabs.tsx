"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"

import { cn } from "@/lib/utils"

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "relative inline-flex h-10 w-fit items-center justify-center gap-1 rounded-xl bg-foreground/[0.05] p-1 text-muted-foreground shadow-[inset_0_1px_2px_--alpha(var(--color-black)/5%)] backdrop-blur-sm dark:bg-black/20",
        className
      )}
      {...props}
    />
  )
}

/**
 * Sliding highlight that animates under the selected tab. Reads the active
 * tab's geometry from the CSS variables Base UI exposes on the indicator.
 */
function TabsIndicator({ className, ...props }: TabsPrimitive.Indicator.Props) {
  return (
    <TabsPrimitive.Indicator
      data-slot="tabs-indicator"
      className={cn(
        "absolute top-1/2 left-0 z-0 h-8 w-(--active-tab-width) -translate-y-1/2 translate-x-(--active-tab-left) rounded-lg bg-card shadow-[inset_0_1px_0_0_var(--glass-highlight),0_1px_3px_--alpha(var(--color-black)/10%)] ring-1 ring-foreground/5 transition-[translate,width] duration-[350ms] ease-spring",
        className
      )}
      {...props}
    />
  )
}

function TabsTab({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-tab"
      className={cn(
        "relative z-10 inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 hover:text-foreground data-[selected]:text-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform data-[selected]:[&_svg]:scale-110",
        className
      )}
      {...props}
    />
  )
}

function TabsPanel({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-panel"
      className={cn(
        "outline-none data-[selected]:animate-in data-[selected]:fade-in-0 data-[selected]:slide-in-from-bottom-1 data-[selected]:duration-300 data-[selected]:ease-fluid",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTab, TabsPanel, TabsIndicator }
