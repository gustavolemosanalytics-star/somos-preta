"use client"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Alternativa ao Select do Radix para listas curtas de opções fixas.
 * O Select do Radix fecha se o ponteiro se mover mais de 10px entre
 * pressionar e soltar (emulação do <select> nativo do SO) — em trackpad
 * isso causa o dropdown abrir e fechar no mesmo gesto. O DropdownMenu
 * não tem essa lógica, então reaproveitamos ele aqui.
 */
export function DropdownSelect({ value, onValueChange, options, placeholder, disabled, className, size = "default" }: {
    value: string
    onValueChange: (v: string) => void
    options: { value: string; label: string }[]
    placeholder?: string
    disabled?: boolean
    className?: string
    size?: "sm" | "default"
}) {
    const selecionado = options.find((o) => o.value === value)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={disabled}>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        "w-full justify-between font-normal border-input bg-transparent dark:bg-input/30 dark:hover:bg-input/50",
                        size === "sm" ? "h-8" : "h-9",
                        className
                    )}
                >
                    <span className={cn("truncate", !selecionado && "text-muted-foreground")}>
                        {selecionado?.label ?? placeholder}
                    </span>
                    <ChevronDownIcon className="h-4 w-4 opacity-50 shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[8rem]" align="start">
                <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
                    {options.map((o) => (
                        <DropdownMenuRadioItem key={o.value} value={o.value}>{o.label}</DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
