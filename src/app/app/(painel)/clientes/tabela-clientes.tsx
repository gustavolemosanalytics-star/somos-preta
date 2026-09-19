"use client"

import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    ArrowDown, ArrowUp, ArrowUpDown, Building2, ExternalLink, MoreHorizontal,
    Pencil, Star, Trash2,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
    DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { CLIENTE_STATUS, CLIENTE_STATUS_ORDEM } from "@/lib/constants/campanhas"
import type { ClienteStatus } from "@/lib/db/types"
import { cn } from "@/lib/utils"
import type {
    ClienteDaLista, ColunaOrdenavel, Ordenacao, UltimaAtividade,
} from "./tipos"

function Cabecalho({ coluna, label, ordenacao, onOrdenar, className }: {
    coluna: ColunaOrdenavel
    label: string
    ordenacao: Ordenacao
    onOrdenar: (c: ColunaOrdenavel) => void
    className?: string
}) {
    const ativa = ordenacao.coluna === coluna
    const Icone = !ativa ? ArrowUpDown : ordenacao.direcao === "asc" ? ArrowUp : ArrowDown

    return (
        <TableHead className={className}>
            <button
                type="button"
                onClick={() => onOrdenar(coluna)}
                className="inline-flex h-auto min-h-0 items-center gap-1 text-left font-medium hover:text-foreground"
                aria-label={`Ordenar por ${label}`}
            >
                {label}
                <Icone className={cn("h-3 w-3", ativa ? "text-foreground" : "text-muted-foreground/50")} />
            </button>
        </TableHead>
    )
}

function LogoCliente({ cliente }: { cliente: ClienteDaLista }) {
    if (cliente.logo_url) {
        // <img> e não next/image: logo_url é URL digitada à mão, de host
        // arbitrário, e o projeto não declara images.remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={cliente.logo_url} alt="" className="h-9 w-9 shrink-0 rounded-lg bg-muted object-contain" />
    }
    return (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Building2 className="h-4 w-4" />
        </span>
    )
}

export function TabelaClientes({
    clientes, campanhasPorCliente, atividadePorCliente, favoritos, selecionado,
    ordenacao, onOrdenar, onSelecionar, onEditar, onExcluir, onStatus, onFavorito,
}: {
    clientes: ClienteDaLista[]
    campanhasPorCliente: Map<string, { total: number; ativas: number }>
    atividadePorCliente: Map<string, UltimaAtividade>
    favoritos: Set<string>
    selecionado: string | null
    ordenacao: Ordenacao
    onOrdenar: (c: ColunaOrdenavel) => void
    onSelecionar: (id: string) => void
    onEditar: (c: ClienteDaLista) => void
    onExcluir: (c: ClienteDaLista) => void
    onStatus: (c: ClienteDaLista, s: ClienteStatus) => void
    onFavorito: (c: ClienteDaLista) => void
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <Cabecalho coluna="nome" label="Cliente" ordenacao={ordenacao} onOrdenar={onOrdenar} />
                    <Cabecalho coluna="segmento" label="Segmento" ordenacao={ordenacao} onOrdenar={onOrdenar} className="hidden md:table-cell" />
                    <Cabecalho coluna="local" label="Local" ordenacao={ordenacao} onOrdenar={onOrdenar} className="hidden lg:table-cell" />
                    <Cabecalho coluna="campanhas" label="Campanhas" ordenacao={ordenacao} onOrdenar={onOrdenar} className="hidden sm:table-cell" />
                    <Cabecalho coluna="responsavel" label="Responsável" ordenacao={ordenacao} onOrdenar={onOrdenar} className="hidden xl:table-cell" />
                    <Cabecalho coluna="atividade" label="Última atividade" ordenacao={ordenacao} onOrdenar={onOrdenar} className="hidden xl:table-cell" />
                    <Cabecalho coluna="status" label="Status" ordenacao={ordenacao} onOrdenar={onOrdenar} />
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {clientes.map((c) => {
                    const campanhas = campanhasPorCliente.get(c.id) ?? { total: 0, ativas: 0 }
                    const atividade = atividadePorCliente.get(c.id)
                    const meta = CLIENTE_STATUS[c.status]
                    const ativo = selecionado === c.id

                    return (
                        <TableRow
                            key={c.id}
                            data-state={ativo ? "selected" : undefined}
                            // A linha selecionada ganha barra à esquerda: o fundo
                            // sozinho some no tema claro.
                            className={cn(ativo && "border-l-2 border-l-primary bg-primary/5")}
                        >
                            <TableCell className="max-w-[260px] font-medium whitespace-normal">
                                <button
                                    type="button"
                                    onClick={() => onSelecionar(c.id)}
                                    className="flex h-auto min-h-0 w-full items-center gap-3 text-left"
                                >
                                    <LogoCliente cliente={c} />
                                    <span className="min-w-0">
                                        <span className="flex items-center gap-1.5">
                                            <span className="truncate hover:text-primary">{c.nome}</span>
                                            {favoritos.has(c.id) && (
                                                <Star className="h-3.5 w-3.5 shrink-0 fill-status-atencao text-status-atencao" aria-label="Favorito" />
                                            )}
                                        </span>
                                        {c.empresa && (
                                            <span className="block truncate text-xs font-normal uppercase tracking-wide text-muted-foreground">
                                                {c.empresa}
                                            </span>
                                        )}
                                    </span>
                                </button>
                            </TableCell>

                            <TableCell className="hidden md:table-cell text-muted-foreground">
                                {c.segmento ?? "—"}
                            </TableCell>

                            <TableCell className="hidden lg:table-cell text-muted-foreground">
                                {[c.cidade, c.estado].filter(Boolean).join(" / ") || "—"}
                            </TableCell>

                            <TableCell className="hidden sm:table-cell">
                                {campanhas.total === 0 ? (
                                    <span className="text-muted-foreground">—</span>
                                ) : (
                                    <div className="leading-tight">
                                        <span className="block">
                                            {campanhas.total} {campanhas.total === 1 ? "campanha" : "campanhas"}
                                        </span>
                                        {campanhas.ativas > 0 && (
                                            <span className="block text-xs text-status-sucesso">{campanhas.ativas} ativa{campanhas.ativas > 1 ? "s" : ""}</span>
                                        )}
                                    </div>
                                )}
                            </TableCell>

                            <TableCell className="hidden xl:table-cell">
                                {c.responsavel ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-7 w-7">
                                            {c.responsavel.avatar_url && (
                                                <AvatarImage src={c.responsavel.avatar_url} alt={c.responsavel.nome ?? ""} />
                                            )}
                                            <AvatarFallback className="text-[10px]">
                                                {(c.responsavel.nome ?? c.responsavel.email ?? "?").slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 leading-tight">
                                            <span className="block truncate">{c.responsavel.nome ?? c.responsavel.email}</span>
                                            {c.responsavel.cargo && (
                                                <span className="block truncate text-xs text-muted-foreground">{c.responsavel.cargo}</span>
                                            )}
                                        </div>
                                    </div>
                                ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>

                            <TableCell className="hidden xl:table-cell max-w-[180px]">
                                {atividade ? (
                                    <div className="leading-tight">
                                        <span className="block">
                                            {formatDistanceToNow(new Date(atividade.created_at), { addSuffix: true, locale: ptBR })}
                                        </span>
                                        <span className="block truncate text-xs text-muted-foreground">{atividade.resumo}</span>
                                    </div>
                                ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>

                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button type="button" className="-my-3.5 inline-flex min-h-0 items-center py-3.5" aria-label={`Status de ${c.nome}`}>
                                            <Badge variant="secondary" className={cn("gap-1.5", meta.className)}>
                                                <span className={cn("h-1.5 w-1.5 rounded-full", meta.ponto)} aria-hidden />
                                                {meta.label}
                                            </Badge>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {CLIENTE_STATUS_ORDEM.map((s) => (
                                            <DropdownMenuItem key={s} disabled={s === c.status} onClick={() => onStatus(c, s)}>
                                                <span className={cn("h-2 w-2 rounded-full", CLIENTE_STATUS[s].ponto)} aria-hidden />
                                                {CLIENTE_STATUS[s].label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>

                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon-sm" aria-label={`Ações de ${c.nome}`} title="Mais ações">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52">
                                        <DropdownMenuItem onClick={() => onEditar(c)}>
                                            <Pencil className="h-4 w-4" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onFavorito(c)}>
                                            <Star className={cn("h-4 w-4", favoritos.has(c.id) && "fill-current")} />
                                            {favoritos.has(c.id) ? "Remover dos favoritos" : "Favoritar"}
                                        </DropdownMenuItem>
                                        {c.site && (
                                            <DropdownMenuItem asChild>
                                                <a href={c.site} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4" /> Abrir site
                                                </a>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                <Building2 className="h-4 w-4" /> Mudar status
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                {CLIENTE_STATUS_ORDEM.map((s) => (
                                                    <DropdownMenuItem key={s} disabled={s === c.status} onClick={() => onStatus(c, s)}>
                                                        {CLIENTE_STATUS[s].label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem variant="destructive" onClick={() => onExcluir(c)}>
                                            <Trash2 className="h-4 w-4" /> Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}
