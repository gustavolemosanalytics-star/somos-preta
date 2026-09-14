"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    Archive, ArchiveRestore, CalendarClock, Copy, MessageSquare, MoreHorizontal,
    Pencil, Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
    DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { UserAvatar } from "@/components/tarefas/user-picker"
import { classeDaCor, dataCurta } from "@/lib/constants/blog"
import {
    TAREFA_PRIORIDADE, TAREFA_STATUS, TAREFA_STATUS_ORDEM, tarefaPrazoBadge,
} from "@/lib/constants/tarefas"
import type { Profile, TarefaStatus } from "@/lib/db/types"
import { cn } from "@/lib/utils"
import type { MapaMetricas, TarefaDaLista } from "./tipos"

export function ListaTarefas({
    tarefas, metricas, profilesById, selecionados,
    onAlternar, onAlternarTodos, onEditar, onStatus, onDuplicar, onArquivar, onExcluir,
}: {
    tarefas: TarefaDaLista[]
    metricas: MapaMetricas
    profilesById: Map<string, Profile>
    selecionados: string[]
    onAlternar: (id: string) => void
    onAlternarTodos: () => void
    onEditar: (t: TarefaDaLista) => void
    onStatus: (t: TarefaDaLista, s: TarefaStatus) => void
    onDuplicar: (t: TarefaDaLista) => void
    onArquivar: (t: TarefaDaLista) => void
    onExcluir: (t: TarefaDaLista) => void
}) {
    const todos = tarefas.length > 0 && tarefas.every((t) => selecionados.includes(t.id))
    const alguns = tarefas.some((t) => selecionados.includes(t.id))

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-10">
                        {/*
                          min-h-0/min-w-0 desfaz aqui a regra de alvo de toque de
                          44px do globals.css — o Checkbox do Radix é um <button>,
                          e a caixa desenhada de 16px estouraria a coluna.
                        */}
                        <Checkbox
                            checked={alguns && !todos ? "indeterminate" : todos}
                            onCheckedChange={onAlternarTodos}
                            aria-label="Selecionar todas as tarefas desta página"
                            className="min-h-0 min-w-0 data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary/40"
                        />
                    </TableHead>
                    <TableHead>Tarefa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Prioridade</TableHead>
                    <TableHead className="hidden xl:table-cell">Campanha / Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Responsável</TableHead>
                    <TableHead className="hidden sm:table-cell">Prazo</TableHead>
                    <TableHead className="hidden xl:table-cell">Subtarefas</TableHead>
                    <TableHead className="hidden 2xl:table-cell">Tags</TableHead>
                    <TableHead className="hidden 2xl:table-cell">Última atualização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {tarefas.map((t) => {
                    const m = metricas.get(t.id)
                    const sub = Number(m?.subtarefas_total ?? 0)
                    const feitas = Number(m?.subtarefas_concluidas ?? 0)
                    const comentarios = Number(m?.comentarios ?? 0)
                    const prazo = tarefaPrazoBadge(t)
                    const responsavel = t.responsavel ? profilesById.get(t.responsavel) : null

                    return (
                        <TableRow key={t.id} data-state={selecionados.includes(t.id) ? "selected" : undefined}>
                            <TableCell>
                                <Checkbox
                                    checked={selecionados.includes(t.id)}
                                    onCheckedChange={() => onAlternar(t.id)}
                                    aria-label={`Selecionar ${t.titulo}`}
                                    className="min-h-0 min-w-0"
                                />
                            </TableCell>

                            <TableCell className="max-w-[280px] font-medium whitespace-normal">
                                <Link
                                    href={`/tarefas/${t.id}`}
                                    className={cn(
                                        "block truncate hover:text-primary",
                                        t.status === "concluida" && "text-muted-foreground line-through",
                                    )}
                                    title={t.titulo}
                                >
                                    {t.titulo}
                                </Link>
                                {t.area && (
                                    <Badge variant="secondary" className={cn("mt-1", classeDaCor(t.area.cor))}>
                                        {t.area.nome}
                                    </Badge>
                                )}
                            </TableCell>

                            <TableCell>
                                <Badge variant="secondary" className={TAREFA_STATUS[t.status].className}>
                                    {TAREFA_STATUS[t.status].label}
                                </Badge>
                            </TableCell>

                            <TableCell className="hidden lg:table-cell">
                                <span className={cn("text-xs font-medium", TAREFA_PRIORIDADE[t.prioridade].className)}>
                                    {TAREFA_PRIORIDADE[t.prioridade].label}
                                </span>
                            </TableCell>

                            <TableCell className="hidden xl:table-cell max-w-[180px]">
                                {t.campanha ? (
                                    <div className="leading-tight">
                                        <Link href={`/campanhas/${t.campanha.id}`} className="block truncate hover:text-primary">
                                            {t.campanha.nome}
                                        </Link>
                                        {t.campanha.cliente && (
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {t.campanha.cliente.nome}
                                            </span>
                                        )}
                                    </div>
                                ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>

                            <TableCell className="hidden md:table-cell">
                                {responsavel ? (
                                    <div className="flex items-center gap-2">
                                        <UserAvatar profile={responsavel} />
                                        <span className="truncate text-sm">{responsavel.nome ?? responsavel.email}</span>
                                    </div>
                                ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>

                            <TableCell className="hidden sm:table-cell">
                                {t.data_entrega ? (
                                    prazo ? (
                                        <span className={cn("flex items-center gap-1 text-sm", prazo.className.replace(/bg-[^ ]+/, ""))}>
                                            <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                            {prazo.label}
                                        </span>
                                    ) : (
                                        <span className="text-sm">
                                            {dataCurta(t.data_entrega)}
                                            {t.horario && <span className="block text-xs text-muted-foreground">{t.horario.slice(0, 5)}</span>}
                                        </span>
                                    )
                                ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>

                            <TableCell className="hidden xl:table-cell">
                                {sub > 0 ? (
                                    <div className="w-24 space-y-1">
                                        <span className="text-xs text-muted-foreground">{feitas}/{sub}</span>
                                        <Progress value={Math.round((feitas / sub) * 100)} className="h-1" />
                                    </div>
                                ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>

                            <TableCell className="hidden 2xl:table-cell">
                                <div className="flex max-w-[140px] flex-wrap gap-1">
                                    {t.tags.slice(0, 2).map((tag) => (
                                        <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                                    ))}
                                    {comentarios > 0 && (
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <MessageSquare className="h-3 w-3" aria-hidden /> {comentarios}
                                        </span>
                                    )}
                                </div>
                            </TableCell>

                            <TableCell className="hidden 2xl:table-cell text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(t.updated_at), { addSuffix: true, locale: ptBR })}
                            </TableCell>

                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon-sm" aria-label={`Ações de ${t.titulo}`} title="Mais ações">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52">
                                        <DropdownMenuItem onClick={() => onEditar(t)}>
                                            <Pencil className="h-4 w-4" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                <CalendarClock className="h-4 w-4" /> Mudar status
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                {TAREFA_STATUS_ORDEM.map((s) => {
                                                    // Evidência obrigatória só pode ser cumprida na
                                                    // página da tarefa, onde o anexo é enviado.
                                                    const travado = s === "concluida" && t.evidencia_obrigatoria
                                                    return (
                                                        <DropdownMenuItem
                                                            key={s}
                                                            disabled={s === t.status || travado}
                                                            onClick={() => onStatus(t, s)}
                                                            title={travado ? "Esta tarefa exige evidência — conclua pela página da tarefa" : undefined}
                                                        >
                                                            {TAREFA_STATUS[s].label}
                                                        </DropdownMenuItem>
                                                    )
                                                })}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        <DropdownMenuItem onClick={() => onDuplicar(t)}>
                                            <Copy className="h-4 w-4" /> Duplicar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onArquivar(t)}>
                                            {t.arquivada
                                                ? <><ArchiveRestore className="h-4 w-4" /> Desarquivar</>
                                                : <><Archive className="h-4 w-4" /> Arquivar</>}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem variant="destructive" onClick={() => onExcluir(t)}>
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
