"use client"

import { Filter, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownSelect } from "@/components/ui/dropdown-select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * Linha de filtros do painel: busca + N dropdowns + "Limpar filtros".
 *
 * As quatro telas repetem a mesma estrutura com listas diferentes, então o que
 * varia vem por prop. Usa DropdownSelect, e não o Select do Radix: o Select
 * fecha sozinho quando o ponteiro anda mais de 10px entre pressionar e soltar,
 * o que em trackpad abre e fecha no mesmo gesto (ver o comentário em
 * ui/dropdown-select.tsx).
 */

export type FiltroSelecao = {
    chave: string
    /** Rótulo acessível — o visual fica no texto da opção selecionada. */
    label: string
    valor: string
    opcoes: { value: string; label: string }[]
    onChange: (v: string) => void
    className?: string
}

export function BarraFiltros({
    busca, onBusca, placeholder = "Buscar...", filtros, ativos, onLimpar, extras, className,
}: {
    busca: string
    onBusca: (v: string) => void
    placeholder?: string
    filtros: FiltroSelecao[]
    /** Se algo está filtrado — desabilita "Limpar filtros" quando não está. */
    ativos: boolean
    onLimpar: () => void
    /** Controles próprios da tela, como o toggle "Minhas tarefas". */
    extras?: React.ReactNode
    className?: string
}) {
    return (
        <div className={cn("flex flex-col gap-3 lg:flex-row lg:items-center", className)}>
            <div className="relative flex-1 lg:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder={placeholder}
                    aria-label={placeholder}
                    value={busca}
                    onChange={(e) => onBusca(e.target.value)}
                    className="rounded-xl pl-9"
                />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap">
                {filtros.map((f) => (
                    <DropdownSelect
                        key={f.chave}
                        value={f.valor}
                        onValueChange={f.onChange}
                        options={f.opcoes}
                        aria-label={f.label}
                        className={cn("lg:w-[160px]", f.className)}
                    />
                ))}
            </div>

            {extras}

            <Button
                variant="outline"
                className="rounded-xl lg:ml-auto"
                onClick={onLimpar}
                disabled={!ativos}
            >
                <Filter className="h-4 w-4" /> Limpar filtros
            </Button>
        </div>
    )
}
