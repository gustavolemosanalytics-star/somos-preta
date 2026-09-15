"use client"

import { useState } from "react"
import Link from "next/link"
import {
    DndContext, DragOverlay, PointerSensor, closestCorners, useDraggable,
    useDroppable, useSensor, useSensors,
    type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core"
import {
    Archive, ArchiveRestore, CalendarDays, Copy, MessageSquare, MoreHorizontal,
    Paperclip, Pencil, Plus, Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
    DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { UserAvatar } from "@/components/tarefas/user-picker"
import { classeDaCor, dataCurta } from "@/lib/constants/blog"
import {
    STATUS_PADRAO_DA_COLUNA, TAREFA_BOARD_COLUNAS, TAREFA_STATUS,
    TAREFA_STATUS_ORDEM, tarefaPrazoBadge,
} from "@/lib/constants/tarefas"
import type { Profile, TarefaStatus } from "@/lib/db/types"
import { cn } from "@/lib/utils"
import type { MapaMetricas, TarefaDaLista } from "./tipos"

export type AcoesDoCard = {
    onEditar: (t: TarefaDaLista) => void
    onStatus: (t: TarefaDaLista, s: TarefaStatus) => void
    onDuplicar: (t: TarefaDaLista) => void
    onArquivar: (t: TarefaDaLista) => void
    onExcluir: (t: TarefaDaLista) => void
}

function MenuDoCard({ tarefa, acoes }: { tarefa: TarefaDaLista; acoes: AcoesDoCard }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 min-h-0 min-w-0 shrink-0 text-muted-foreground"
                    aria-label={`Ações de ${tarefa.titulo}`}
                    title="Mais ações"
                    // Sem isto o sensor do dnd-kit captura o toque e o menu
                    // nunca abre — o clique vira o começo de um arraste.
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => acoes.onEditar(tarefa)}>
                    <Pencil className="h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <CalendarDays className="h-4 w-4" /> Mudar status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {TAREFA_STATUS_ORDEM.map((s) => {
                            // Evidência obrigatória só pode ser cumprida na página
                            // da tarefa, onde o anexo é enviado.
                            const travado = s === "concluida" && tarefa.evidencia_obrigatoria
                            return (
                                <DropdownMenuItem
                                    key={s}
                                    disabled={s === tarefa.status || travado}
                                    onClick={() => acoes.onStatus(tarefa, s)}
                                    title={travado ? "Esta tarefa exige evidência — conclua pela página dela" : undefined}
                                >
                                    {TAREFA_STATUS[s].label}
                                </DropdownMenuItem>
                            )
                        })}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={() => acoes.onDuplicar(tarefa)}>
                    <Copy className="h-4 w-4" /> Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => acoes.onArquivar(tarefa)}>
                    {tarefa.arquivada
                        ? <><ArchiveRestore className="h-4 w-4" /> Desarquivar</>
                        : <><Archive className="h-4 w-4" /> Arquivar</>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => acoes.onExcluir(tarefa)}>
                    <Trash2 className="h-4 w-4" /> Excluir
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

/**
 * Card do board.
 *
 * As linhas são fixas e o rodapé é empurrado para baixo: sem isso, um card com
 * subtarefas ficava bem mais alto que o vizinho sem, e a coluna virava uma
 * escada. O que não existe naquela tarefa vira espaço reservado, não linha a
 * menos.
 */
function CardTarefa({ tarefa, metricas, profilesById, acoes, arrastando }: {
    tarefa: TarefaDaLista
    metricas: MapaMetricas
    profilesById: Map<string, Profile>
    acoes?: AcoesDoCard
    arrastando?: boolean
}) {
    const m = metricas.get(tarefa.id)
    const sub = Number(m?.subtarefas_total ?? 0)
    const feitas = Number(m?.subtarefas_concluidas ?? 0)
    const comentarios = Number(m?.comentarios ?? 0)
    const anexos = Number(m?.anexos ?? 0)
    const prazo = tarefaPrazoBadge(tarefa)
    const responsavel = tarefa.responsavel ? profilesById.get(tarefa.responsavel) : null

    return (
        <Card className={cn(
            "h-full transition-shadow",
            arrastando && "rotate-1 shadow-lg",
            tarefa.arquivada && "opacity-60",
        )}>
            <CardContent className="flex h-full flex-col gap-2 p-3">
                <div className="flex items-start gap-1">
                    <Link
                        href={`/tarefas/${tarefa.id}`}
                        // Duas linhas fixas: título curto e título longo ocupam a
                        // mesma altura, e a fileira de cards não desalinha.
                        className="line-clamp-2 min-h-[2.5rem] flex-1 text-sm font-medium leading-snug hover:text-primary"
                        title={tarefa.titulo}
                    >
                        {tarefa.titulo}
                    </Link>
                    {acoes && <MenuDoCard tarefa={tarefa} acoes={acoes} />}
                </div>

                <div className="flex min-h-6 flex-wrap items-center gap-1.5">
                    {tarefa.area && (
                        <Badge variant="secondary" className={classeDaCor(tarefa.area.cor)}>
                            {tarefa.area.nome}
                        </Badge>
                    )}
                    {tarefa.campanha && (
                        <Badge variant="outline" className="max-w-full truncate text-muted-foreground">
                            {tarefa.campanha.nome}
                        </Badge>
                    )}
                </div>

                {/* Reservado mesmo sem subtarefa: é o que mantém a altura igual. */}
                <div className="min-h-[1.75rem]">
                    {sub > 0 && (
                        <div className="space-y-1">
                            <p className="text-[11px] text-muted-foreground">{feitas}/{sub} subtarefas</p>
                            <Progress value={Math.round((feitas / sub) * 100)} className="h-1" />
                        </div>
                    )}
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t pt-2">
                    <span className="flex min-w-0 items-center gap-2">
                        {responsavel && <UserAvatar profile={responsavel} />}
                        {tarefa.data_entrega && (
                            <span className={cn(
                                "flex items-center gap-1 truncate text-[11px]",
                                prazo ? "text-status-erro" : "text-muted-foreground",
                            )}>
                                <CalendarDays className="h-3 w-3 shrink-0" aria-hidden />
                                {prazo?.label ?? dataCurta(tarefa.data_entrega)}
                            </span>
                        )}
                    </span>

                    <span className="flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground">
                        {comentarios > 0 && (
                            <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" aria-hidden /> {comentarios}
                            </span>
                        )}
                        {anexos > 0 && (
                            <span className="flex items-center gap-1">
                                <Paperclip className="h-3 w-3" aria-hidden /> {anexos}
                            </span>
                        )}
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}

/** Envelope arrastável; o card em si não conhece DnD. */
function CardArrastavel(props: {
    tarefa: TarefaDaLista
    metricas: MapaMetricas
    profilesById: Map<string, Profile>
    acoes: AcoesDoCard
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: props.tarefa.id })

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            // w-full explícito: sem largura própria o item arrastável encolhe
            // para o conteúdo e o card sai mais estreito que os vizinhos.
            // O original some enquanto o DragOverlay desenha a cópia.
            className={cn("w-full touch-none", isDragging && "opacity-40")}
        >
            <CardTarefa {...props} />
        </div>
    )
}

function Coluna({ titulo, tarefas, metricas, profilesById, acoes, onNova }: {
    titulo: string
    tarefas: TarefaDaLista[]
    metricas: MapaMetricas
    profilesById: Map<string, Profile>
    acoes: AcoesDoCard
    onNova: (status: TarefaStatus) => void
}) {
    const { setNodeRef, isOver } = useDroppable({ id: titulo })
    const status = STATUS_PADRAO_DA_COLUNA[titulo]

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex min-w-0 flex-col gap-3 rounded-xl border bg-muted/30 p-3 transition-colors",
                isOver && "border-primary/50 bg-primary/5",
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold">
                    {titulo}
                    <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1">{tarefas.length}</Badge>
                </p>
                <Button
                    variant="ghost" size="icon-sm"
                    onClick={() => onNova(status)}
                    aria-label={`Nova tarefa em ${titulo}`} title="Nova tarefa"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex flex-col gap-2">
                {tarefas.map((t) => (
                    <CardArrastavel
                        key={t.id}
                        tarefa={t}
                        metricas={metricas}
                        profilesById={profilesById}
                        acoes={acoes}
                    />
                ))}
            </div>

            <Button
                variant="ghost" size="sm"
                className="justify-start text-muted-foreground"
                onClick={() => onNova(status)}
            >
                <Plus className="h-3.5 w-3.5" /> Adicionar tarefa
            </Button>
        </div>
    )
}

/**
 * Board de cinco colunas com arrastar-e-soltar.
 *
 * O `activationConstraint` de 6px existe para o clique no título continuar
 * abrindo a tarefa: sem ele, qualquer toque vira o começo de um arraste e o
 * link nunca dispara.
 */
export function Board({ tarefas, metricas, profilesById, acoes, onMoverStatus, onNova }: {
    tarefas: TarefaDaLista[]
    metricas: MapaMetricas
    profilesById: Map<string, Profile>
    acoes: AcoesDoCard
    onMoverStatus: (t: TarefaDaLista, status: TarefaStatus) => void
    onNova: (status: TarefaStatus) => void
}) {
    const [arrastando, setArrastando] = useState<TarefaDaLista | null>(null)
    const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

    function aoSoltar(e: DragEndEvent) {
        setArrastando(null)
        const coluna = e.over?.id
        if (!coluna || typeof coluna !== "string") return

        const tarefa = tarefas.find((t) => t.id === e.active.id)
        const destino = STATUS_PADRAO_DA_COLUNA[coluna]
        if (!tarefa || !destino) return

        // Soltar na própria coluna não é mudança: mover "bloqueada" para dentro
        // de Em andamento a converteria em "em_andamento" sem ninguém pedir.
        const colunaAtual = TAREFA_BOARD_COLUNAS.find((c) => c.status.includes(tarefa.status))
        if (colunaAtual?.titulo === coluna) return

        onMoverStatus(tarefa, destino)
    }

    function aoPegar(e: DragStartEvent) {
        setArrastando(tarefas.find((t) => t.id === e.active.id) ?? null)
    }

    return (
        <DndContext
            sensors={sensores}
            collisionDetection={closestCorners}
            onDragStart={aoPegar}
            onDragEnd={aoSoltar}
            onDragCancel={() => setArrastando(null)}
        >
            <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                {TAREFA_BOARD_COLUNAS.map((coluna) => (
                    <Coluna
                        key={coluna.titulo}
                        titulo={coluna.titulo}
                        tarefas={tarefas.filter((t) => coluna.status.includes(t.status))}
                        metricas={metricas}
                        profilesById={profilesById}
                        acoes={acoes}
                        onNova={onNova}
                    />
                ))}
            </div>

            <DragOverlay>
                {arrastando && (
                    <CardTarefa
                        tarefa={arrastando}
                        metricas={metricas}
                        profilesById={profilesById}
                        arrastando
                    />
                )}
            </DragOverlay>
        </DndContext>
    )
}
