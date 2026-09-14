"use client"

import { useState } from "react"
import Link from "next/link"
import {
    DndContext, DragOverlay, PointerSensor, closestCorners, useDraggable,
    useDroppable, useSensor, useSensors,
    type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core"
import { CalendarDays, MessageSquare, Paperclip, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { UserAvatar } from "@/components/tarefas/user-picker"
import { dataCurta } from "@/lib/constants/blog"
import { classeDaCor } from "@/lib/constants/blog"
import {
    STATUS_PADRAO_DA_COLUNA, TAREFA_BOARD_COLUNAS, tarefaPrazoBadge,
} from "@/lib/constants/tarefas"
import type { Profile, TarefaStatus } from "@/lib/db/types"
import { cn } from "@/lib/utils"
import type { MapaMetricas, TarefaDaLista } from "./tipos"

function CardTarefa({ tarefa, metricas, profilesById, arrastando }: {
    tarefa: TarefaDaLista
    metricas: MapaMetricas
    profilesById: Map<string, Profile>
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
            "rounded-xl border-border/60 transition-shadow",
            arrastando && "rotate-1 shadow-lg",
            tarefa.arquivada && "opacity-60",
        )}>
            <CardContent className="space-y-2.5 p-3">
                <Link
                    href={`/tarefas/${tarefa.id}`}
                    className="block text-sm font-medium leading-snug hover:text-primary"
                    onClick={(e) => e.stopPropagation()}
                >
                    {tarefa.titulo}
                </Link>

                <div className="flex flex-wrap items-center gap-1.5">
                    {tarefa.area && (
                        <Badge variant="secondary" className={classeDaCor(tarefa.area.cor)}>{tarefa.area.nome}</Badge>
                    )}
                    {tarefa.campanha && (
                        <Badge variant="outline" className="text-muted-foreground">{tarefa.campanha.nome}</Badge>
                    )}
                </div>

                {sub > 0 && (
                    <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">{feitas}/{sub} subtarefas</p>
                        <Progress value={Math.round((feitas / sub) * 100)} className="h-1" />
                    </div>
                )}

                {tarefa.data_entrega && (
                    <p className={cn(
                        "flex items-center gap-1.5 text-xs",
                        prazo ? prazo.className.replace(/bg-[^ ]+/, "") : "text-muted-foreground",
                    )}>
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {prazo?.label ?? dataCurta(tarefa.data_entrega)}
                    </p>
                )}

                <div className="flex items-center justify-between gap-2 pt-0.5">
                    {responsavel ? <UserAvatar profile={responsavel} /> : <span />}
                    <span className="flex items-center gap-2.5 text-xs text-muted-foreground">
                        {comentarios > 0 && (
                            <span className="flex items-center gap-1">
                                <MessageSquare className="h-3.5 w-3.5" aria-hidden /> {comentarios}
                            </span>
                        )}
                        {anexos > 0 && (
                            <span className="flex items-center gap-1">
                                <Paperclip className="h-3.5 w-3.5" aria-hidden /> {anexos}
                            </span>
                        )}
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}

/** Envelope arrastável; o card em si não conhece DnD. */
function CardArrastavel(props: { tarefa: TarefaDaLista; metricas: MapaMetricas; profilesById: Map<string, Profile> }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: props.tarefa.id })

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            // O original some enquanto o DragOverlay desenha a cópia; sem isso a
            // tarefa aparece em dois lugares ao mesmo tempo.
            className={cn("touch-none", isDragging && "opacity-40")}
        >
            <CardTarefa {...props} />
        </div>
    )
}

function Coluna({ titulo, tarefas, metricas, profilesById, onNova }: {
    titulo: string
    tarefas: TarefaDaLista[]
    metricas: MapaMetricas
    profilesById: Map<string, Profile>
    onNova: (status: TarefaStatus) => void
}) {
    const { setNodeRef, isOver } = useDroppable({ id: titulo })
    const status = STATUS_PADRAO_DA_COLUNA[titulo]

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex min-w-[260px] flex-col gap-3 rounded-2xl border bg-muted/30 p-3 transition-colors",
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
                    <CardArrastavel key={t.id} tarefa={t} metricas={metricas} profilesById={profilesById} />
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
export function Board({ tarefas, metricas, profilesById, onMoverStatus, onNova }: {
    tarefas: TarefaDaLista[]
    metricas: MapaMetricas
    profilesById: Map<string, Profile>
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
            <div className="grid gap-3 overflow-x-auto pb-2 lg:grid-cols-3 xl:grid-cols-5">
                {TAREFA_BOARD_COLUNAS.map((coluna) => (
                    <Coluna
                        key={coluna.titulo}
                        titulo={coluna.titulo}
                        tarefas={tarefas.filter((t) => coluna.status.includes(t.status))}
                        metricas={metricas}
                        profilesById={profilesById}
                        onNova={onNova}
                    />
                ))}
            </div>

            <DragOverlay>
                {arrastando && (
                    <CardTarefa tarefa={arrastando} metricas={metricas} profilesById={profilesById} arrastando />
                )}
            </DragOverlay>
        </DndContext>
    )
}
