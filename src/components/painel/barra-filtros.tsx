"use client"

import { Filter, Search, SlidersHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownSelect } from "@/components/ui/dropdown-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

/**
 * Linha de filtros do painel.
 *
 * O desenho anterior punha todos os seletores numa linha só. Com sete deles, a
 * busca era espremida a uns 50px e metade dos gatilhos truncava o PRÓPRIO NOME
 * — "Campanha: to…", "Responsável: t…" —, que é justamente a parte que diz o
 * que aquele controle faz. Sem o nome, um seletor não é um filtro: é um enigma.
 *
 * Agora só os filtros de uso diário ficam à vista, com largura suficiente para
 * o nome caber inteiro. O resto vai para "Mais filtros", com um contador do que
 * está ativo lá dentro para nada ficar filtrando escondido.
 */

export type FiltroSelecao = {
    chave: string
    /** Nome do filtro, em texto corrido: "Área", "Responsável". */
    label: string
    valor: string
    /** O valor que significa "sem filtro" — usado para contar quantos estão ativos. */
    neutro: string
    opcoes: { value: string; label: string }[]
    onChange: (v: string) => void
    className?: string
}

export function BarraFiltros({
    busca, onBusca, placeholder = "Buscar...", filtros, secundarios = [],
    ativos, onLimpar, extras, className,
}: {
    busca: string
    onBusca: (v: string) => void
    placeholder?: string
    /** Ficam à vista. Quatro é o teto confortável antes de começar a truncar. */
    filtros: FiltroSelecao[]
    /** Vão para o popover "Mais filtros". */
    secundarios?: FiltroSelecao[]
    /** Se algo está filtrado — desabilita "Limpar filtros" quando não está. */
    ativos: boolean
    onLimpar: () => void
    /** Controles próprios da tela, como o toggle "Minhas tarefas". */
    extras?: React.ReactNode
    className?: string
}) {
    const secundariosAtivos = secundarios.filter((f) => f.valor !== f.neutro).length

    return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder={placeholder}
                    aria-label={placeholder}
                    value={busca}
                    onChange={(e) => onBusca(e.target.value)}
                    className="rounded-lg pl-9"
                />
            </div>

            {filtros.map((f) => (
                <DropdownSelect
                    key={f.chave}
                    value={f.valor}
                    onValueChange={f.onChange}
                    options={f.opcoes}
                    aria-label={f.label}
                    // min-w e não w: o gatilho cresce com o conteúdo em vez de
                    // cortar o nome do filtro.
                    className={cn(
                        "w-auto min-w-[150px]",
                        f.valor !== f.neutro && "border-primary/40 text-foreground",
                        f.className,
                    )}
                />
            ))}

            {secundarios.length > 0 && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="rounded-lg">
                            <SlidersHorizontal className="h-4 w-4" />
                            Mais filtros
                            {secundariosAtivos > 0 && (
                                <Badge className="ml-1 h-5 min-w-5 justify-center bg-primary px-1 text-primary-foreground">
                                    {secundariosAtivos}
                                </Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-72 space-y-3">
                        {secundarios.map((f) => (
                            <div key={f.chave} className="grid gap-1.5">
                                <Label htmlFor={`filtro-${f.chave}`} className="text-xs text-muted-foreground">
                                    {f.label}
                                </Label>
                                <DropdownSelect
                                    id={`filtro-${f.chave}`}
                                    value={f.valor}
                                    onValueChange={f.onChange}
                                    options={f.opcoes}
                                    aria-label={f.label}
                                />
                            </div>
                        ))}
                    </PopoverContent>
                </Popover>
            )}

            {extras}

            <Button
                variant="ghost"
                className="rounded-lg text-muted-foreground"
                onClick={onLimpar}
                disabled={!ativos}
            >
                <Filter className="h-4 w-4" /> Limpar
            </Button>
        </div>
    )
}
