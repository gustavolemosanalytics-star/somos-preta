"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownSelect } from "@/components/ui/dropdown-select"

/**
 * Rodapé de listagem: "Mostrando X–Y de N", páginas com elipse e o seletor de
 * itens por página.
 *
 * Nasceu na tela de blog; as listas de Tarefas, Campanhas e Clientes pedem o
 * mesmo bloco, e os mocks ainda acrescentam o "Itens por página" que o blog não
 * tinha.
 */

/** Janela de páginas com reticências, no formato "1 … 4 5 6 … 12". */
export function paginasVisiveis(atual: number, total: number): (number | "…")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const perto = [1, total, atual, atual - 1, atual + 1].filter((n) => n >= 1 && n <= total)
    const unicas = [...new Set(perto)].sort((a, b) => a - b)
    const saida: (number | "…")[] = []
    unicas.forEach((n, i) => {
        if (i > 0 && n - (unicas[i - 1] as number) > 1) saida.push("…")
        saida.push(n)
    })
    return saida
}

export const POR_PAGINA_OPCOES = [10, 25, 50, 100]

export function Paginacao({
    total, pagina, porPagina, onPagina, onPorPagina, substantivo = ["item", "itens"],
}: {
    total: number
    pagina: number
    porPagina: number
    onPagina: (n: number) => void
    onPorPagina?: (n: number) => void
    /** Singular e plural, para o texto não sair "1 itens". */
    substantivo?: [string, string]
}) {
    const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
    const atual = Math.min(pagina, totalPaginas)
    const inicio = (atual - 1) * porPagina

    if (total === 0) return null

    return (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
                Mostrando {inicio + 1}–{Math.min(inicio + porPagina, total)} de{" "}
                {total} {total === 1 ? substantivo[0] : substantivo[1]}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
                {onPorPagina && (
                    <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap text-xs text-muted-foreground">Itens por página</span>
                        <DropdownSelect
                            value={String(porPagina)}
                            onValueChange={(v) => onPorPagina(Number(v))}
                            options={POR_PAGINA_OPCOES.map((n) => ({ value: String(n), label: String(n) }))}
                            size="sm"
                            aria-label="Itens por página"
                            className="w-[76px]"
                        />
                    </div>
                )}

                {totalPaginas > 1 && (
                    // flex-wrap porque a regra global de alvo de toque (globals.css)
                    // infla cada botão para 44px e a tira estouraria em telas estreitas.
                    <div className="flex flex-wrap items-center justify-center gap-1">
                        <Button
                            variant="outline" size="icon-sm" className="rounded-lg"
                            disabled={atual === 1} onClick={() => onPagina(atual - 1)}
                            aria-label="Página anterior"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {paginasVisiveis(atual, totalPaginas).map((n, i) => (
                            n === "…" ? (
                                <span key={`sep-${i}`} className="px-1.5 text-sm text-muted-foreground">…</span>
                            ) : (
                                <Button
                                    key={n}
                                    variant={n === atual ? "default" : "outline"}
                                    size="icon-sm" className="rounded-lg"
                                    onClick={() => onPagina(n)}
                                    aria-current={n === atual ? "page" : undefined}
                                >
                                    {n}
                                </Button>
                            )
                        ))}
                        <Button
                            variant="outline" size="icon-sm" className="rounded-lg"
                            disabled={atual === totalPaginas} onClick={() => onPagina(atual + 1)}
                            aria-label="Próxima página"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
