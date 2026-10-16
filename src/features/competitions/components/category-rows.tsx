"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_FORMAT_LABEL } from "@/features/competitions/lib/labels";
import type { CategoryFormat, CategoryInput } from "@/types/api/competitions";

const FORMATS: CategoryFormat[] = ["GROUPS_KNOCKOUT", "KNOCKOUT", "ROUND_ROBIN"];

/** The torneo's categories: a name and how it's played. */
export function CategoryRows({
  value,
  onChange,
  disabled,
}: {
  value: CategoryInput[];
  onChange: (categories: CategoryInput[]) => void;
  disabled?: boolean;
}) {
  function patch(index: number, change: Partial<CategoryInput>) {
    onChange(value.map((c, i) => (i === index ? { ...c, ...change } : c)));
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((category, index) => (
        <div key={index} className="grid grid-cols-[1fr_12rem_auto] items-center gap-2">
          <Input
            aria-label="Nombre de la categoría"
            placeholder="4ta, 6ta, Mixto…"
            value={category.name}
            maxLength={60}
            onChange={(e) => patch(index, { name: e.target.value })}
            disabled={disabled}
          />
          <Select
            value={category.format}
            onValueChange={(v) => patch(index, { format: (v ?? "GROUPS_KNOCKOUT") as CategoryFormat })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue>{(v) => CATEGORY_FORMAT_LABEL[v as CategoryFormat] ?? ""}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FORMATS.map((f) => (
                <SelectItem key={f} value={f}>
                  {CATEGORY_FORMAT_LABEL[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Quitar categoría"
            disabled={disabled || value.length === 1}
            onClick={() => onChange(value.filter((_, i) => i !== index))}
          >
            <X />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => onChange([...value, { name: "", format: "GROUPS_KNOCKOUT" }])}
        disabled={disabled}
      >
        <Plus />
        Agregar categoría
      </Button>
    </div>
  );
}
