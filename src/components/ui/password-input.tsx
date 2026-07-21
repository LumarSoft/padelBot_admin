"use client";

import * as React from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PASSWORD_RULES } from "@/lib/password";

/**
 * A password field with a reveal toggle ("el ojito"). Typing a password blind is how people
 * end up locked out by a typo, so every password input in the panel uses this — never a bare
 * `<Input type="password">`.
 */
function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-9", className)}
      />
      <button
        type="button"
        // A password field is never a form's submit target — keep Enter submitting the form.
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        disabled={props.disabled}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute top-1/2 right-1 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-3 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
      >
        {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
    </div>
  );
}

/**
 * Live checklist of the password policy. Rules go grey → green as they're met, so the user
 * sees exactly what's missing instead of staring at a disabled button. Untouched rules stay
 * neutral; once they've typed something, a failing rule reads as failing.
 */
function PasswordRequirements({
  value,
  className,
  ...props
}: React.ComponentProps<"ul"> & { value: string }) {
  const touched = value.length > 0;

  return (
    <ul {...props} className={cn("flex flex-col gap-1", className)}>
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors duration-200",
              ok
                ? "text-emerald-600 dark:text-emerald-400"
                : touched
                  ? "text-destructive"
                  : "text-muted-foreground",
            )}
          >
            {ok ? (
              <Check className="size-3 shrink-0" />
            ) : touched ? (
              <X className="size-3 shrink-0" />
            ) : (
              <span className="bg-muted-foreground/40 size-1.5 shrink-0 rounded-full" />
            )}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

export { PasswordInput, PasswordRequirements };
