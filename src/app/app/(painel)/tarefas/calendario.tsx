"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownSelect } from "@/components/ui/dropdown-select"
import { classeDaCor, dataCurta } from "@/lib/constants/blog"
import { TAREFA_STATUS } from "@/lib/constants/tarefas"
import type { Area } from "@/lib/db/types"
import { cn } from "@/lib/utils"
import type { TarefaDaLista } from "./tipos"

const HORA_INICIO = 8
const HORA_FIM = 18
const ALTURA_HORA = 56

const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MESES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]

/** Data local em YYYY-MM-DD — toISOString converteria para UTC e viraria o dia. */
function chaveDoDia(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Os sete dias da semana que contém `ref`, começando no domingo. */
function semanaDe(ref: Date) {
    const inicio = new Date(ref)
    inicio.setDate(ref.getDate() - ref.getDay())
    inicio.setHours(0, 0, 0, 0)
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(inicio)
        d.setDate(inicio.getDate() + i)
        return d
    })
}

function rotuloDaSemana(dias: Date[]) {
    const [a] = dias
    const b = dias[6]
    const mesmoMes = a.getMonth() === b.getMonth()
    const fim = `${b.getDate()} de ${MESES[b.getMonth()]} de ${b.getFullYear()}`
    return mesmoMes ? `${a.getDate()} – ${fim}` : `${a.getDate()} de ${MESES[a.getMonth()]} – ${fim}`
}

/** Minutos desde a meia-noite, ou null quando a tarefa não tem hora. */
function minutosDe(t: TarefaDaLista) {
    if (!t.horario) return null
    const [h, m] = t.horario.split(":").map(Number)
    return h * 60 + (m || 0)
}

function BlocoTarefa({ tarefa, compacto }: { tarefa: TarefaDaLista; compacto?: boolean }) {
    return (
        <Link
            href={`/tarefas/${tarefa.id}`}
            className={cn(
                "block overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-left transition-opacity hover:opacity-90",
                // A cor vem da área: é ela que dá a leitura de relance de "que
                // tipo de trabalho é este" sem precisar ler o título.
                tarefa.area ? classeDaCor(tarefa.area.cor) : "bg-muted text-muted-foreground",
            )}
            style={tarefa.area ? undefined : { borderLeftColor: "var(--muted-foreground)" }}
            title={tarefa.titulo}
        >
            {!compacto && tarefa.horario && (
                <span className="block text-[10px] opacity-80">{tarefa.horario.slice(0, 5)}</span>
            )}
            <span className="block truncate text-[11px] font-medium leading-tight">{tarefa.titulo}</span>
            {!compacto && tarefa.campanha && (
                <span className="block truncate text-[10px] opacity-80">{tarefa.campanha.nome}</span>
            )}
        </Link>
    )
}

export function Calendario({ tarefas, areas, agora, filtros, onFiltro, areaFiltro, onAreaFiltro }: {
    tarefas: TarefaDaLista[]
    areas: Area[]
    /** Instante congelado no carregamento — ler o relógio no render é impuro. */
    agora: number
    filtros: Record<string, boolean>
    onFiltro: (chave: string, v: boolean) => void
    areaFiltro: string
    onAreaFiltro: (v: string) => void
}) {
    const hojeRef = useMemo(() => (agora ? new Date(agora) : new Date(0)), [agora])
    const [referencia, setReferencia] = useState<Date>(() => (agora ? new Date(agora) : new Date()))
    const [modo, setModo] = useState<"semana" | "mes" | "agenda">("semana")

    const dias = useMemo(() => semanaDe(referencia), [referencia])

    /** Tarefas indexadas por dia, para a grade não varrer a lista por célula. */
    const porDia = useMemo(() => {
        const mapa = new Map<string, TarefaDaLista[]>()
        for (const t of tarefas) {
            if (!t.data_entrega) continue
            const atual = mapa.get(t.data_entrega) ?? []
            atual.push(t)
            mapa.set(t.data_entrega, atual)
        }
        for (const lista of mapa.values()) {
            lista.sort((a, b) => (minutosDe(a) ?? -1) - (minutosDe(b) ?? -1))
        }
        return mapa
    }, [tarefas])

    // Uma faixa é o espaço de uma hora; uma marca é a linha do relógio. De 08h
    // às 18h são 10 faixas e 11 marcas — confundir as duas era o que deixava
    // rótulo e linha defasados em uma hora.
    const faixas = Array.from({ length: HORA_FIM - HORA_INICIO }, (_, i) => HORA_INICIO + i)
    const marcas = Array.from({ length: HORA_FIM - HORA_INICIO + 1 }, (_, i) => HORA_INICIO + i)
    const alturaDaGrade = faixas.length * ALTURA_HORA
    const chaveHoje = chaveDoDia(hojeRef)
    const minutosAgora = hojeRef.getHours() * 60 + hojeRef.getMinutes()
    const dentroDaFaixa = minutosAgora >= HORA_INICIO * 60 && minutosAgora <= HORA_FIM * 60

    function navegar(passos: number) {
        setReferencia((r) => {
            const d = new Date(r)
            d.setDate(r.getDate() + passos * (modo === "mes" ? 30 : 7))
            return d
        })
    }

    const OPCOES_RAPIDAS = [
        { chave: "minhas", label: "Minhas tarefas" },
        { chave: "atrasadas", label: "Tarefas atrasadas" },
        { chave: "semana", label: "Vencem esta semana" },
        { chave: "terceiros", label: "Aguardando terceiros" },
        { chave: "concluidas", label: "Concluídas" },
    ]

    return (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
            {/* ---------- coluna esquerda ---------- */}
            <div className="space-y-4">
                <Card>
                    <CardContent className="flex justify-center p-2">
                        <Calendar
                            mode="single"
                            locale={ptBR}
                            selected={referencia}
                            onSelect={(d) => d && setReferencia(d)}
                            month={referencia}
                            onMonthChange={setReferencia}
                            className="p-0"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="space-y-3 p-4">
                        <p className="text-sm font-semibold">Filtros rápidos</p>
                        <ul className="space-y-2">
                            {OPCOES_RAPIDAS.map((o) => (
                                <li key={o.chave}>
                                    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                                        <Checkbox
                                            checked={!!filtros[o.chave]}
                                            onCheckedChange={(v) => onFiltro(o.chave, v === true)}
                                            className="min-h-0 min-w-0"
                                        />
                                        {o.label}
                                    </label>
                                </li>
                            ))}
                        </ul>

                        <div className="space-y-1.5 pt-1">
                            <p className="text-sm font-semibold">Áreas</p>
                            <DropdownSelect
                                value={areaFiltro}
                                onValueChange={onAreaFiltro}
                                aria-label="Filtrar por área"
                                options={[
                                    { value: "__todas__", label: "Todas as áreas" },
                                    ...areas.map((a) => ({ value: a.id, label: a.nome })),
                                ]}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ---------- grade ---------- */}
            <Card>
                <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                            <Button variant="outline" size="icon-sm" className="rounded-lg" onClick={() => navegar(-1)} aria-label="Período anterior">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setReferencia(new Date(agora || Date.now()))}>
                                Hoje
                            </Button>
                            <Button variant="outline" size="icon-sm" className="rounded-lg" onClick={() => navegar(1)} aria-label="Próximo período">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <p className="ml-2 text-sm font-medium">{rotuloDaSemana(dias)}</p>
                        </div>

                        <div className="flex items-center gap-1 rounded-xl border p-1">
                            {(["semana", "mes", "agenda"] as const).map((m) => (
                                <Button
                                    key={m}
                                    size="sm"
                                    variant={modo === m ? "default" : "ghost"}
                                    className="rounded-lg capitalize"
                                    onClick={() => setModo(m)}
                                    aria-pressed={modo === m}
                                >
                                    {m === "mes" ? "Mês" : m}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {modo === "semana" && (
                        <div className="overflow-x-auto">
                            <div className="min-w-[720px]">
                                {/* cabeçalho de dias */}
                                <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b">
                                    <span />
                                    {dias.map((d) => {
                                        const eHoje = chaveDoDia(d) === chaveHoje
                                        return (
                                            <div key={d.toISOString()} className="px-1 pb-2 text-center">
                                                <span className="block text-[11px] text-muted-foreground">{DIAS_CURTOS[d.getDay()]}</span>
                                                <span className={cn(
                                                    "mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm",
                                                    eHoje && "bg-primary font-semibold text-primary-foreground",
                                                )}>
                                                    {d.getDate()}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* faixa de dia inteiro — tarefa sem horário não tem
                                    lugar na grade, e sem esta faixa sumiria da tela */}
                                <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b bg-muted/20">
                                    <span className="px-1 py-1.5 text-right text-[10px] text-muted-foreground">Dia todo</span>
                                    {dias.map((d) => {
                                        const semHora = (porDia.get(chaveDoDia(d)) ?? []).filter((t) => !t.horario)
                                        return (
                                            <div key={d.toISOString()} className="space-y-1 border-l p-1">
                                                {semHora.map((t) => <BlocoTarefa key={t.id} tarefa={t} compacto />)}
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* grade por hora */}
                                {/* pt-3 dá o espaço em que o rótulo das 08:00 se
                                    apoia; sem ele, o primeiro rótulo sobe para
                                    cima da faixa "Dia todo". */}
                                <div className="relative grid grid-cols-[56px_repeat(7,minmax(0,1fr))] pt-3">
                                    <div className="relative" style={{ height: alturaDaGrade }}>
                                        {marcas.map((h) => (
                                            <span
                                                key={h}
                                                className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground"
                                                style={{ top: (h - HORA_INICIO) * ALTURA_HORA }}
                                            >
                                                {String(h).padStart(2, "0")}:00
                                            </span>
                                        ))}
                                    </div>

                                    {dias.map((d) => {
                                        const chave = chaveDoDia(d)
                                        const comHora = (porDia.get(chave) ?? []).filter((t) => t.horario)
                                        const eHoje = chave === chaveHoje

                                        return (
                                            <div
                                                key={d.toISOString()}
                                                // border-b fecha a grade na última marca; sem ele
                                                // as 18:00 ficariam sem linha.
                                                className="relative border-b border-l"
                                                style={{ height: alturaDaGrade }}
                                            >
                                                {faixas.map((h) => (
                                                    <div
                                                        key={h}
                                                        style={{ height: ALTURA_HORA }}
                                                        // A linha vai no TOPO da faixa, que é onde o
                                                        // rótulo está: assim 09:00 é a linha das 09:00.
                                                        className="border-t border-border/50"
                                                    />
                                                ))}

                                                {comHora.map((t) => {
                                                    const min = minutosDe(t) ?? 0
                                                    const topo = ((min - HORA_INICIO * 60) / 60) * ALTURA_HORA
                                                    const altura = Math.max(22, (t.duracao_minutos / 60) * ALTURA_HORA - 2)
                                                    // Fora da faixa 08–18 o bloco seria desenhado fora
                                                    // da caixa; grudá-lo na borda o mantém visível.
                                                    const topoFinal = Math.max(0, Math.min(topo, alturaDaGrade - altura))
                                                    return (
                                                        <div
                                                            key={t.id}
                                                            className="absolute inset-x-1"
                                                            style={{ top: topoFinal, height: altura }}
                                                        >
                                                            <BlocoTarefa tarefa={t} />
                                                        </div>
                                                    )
                                                })}

                                                {eHoje && dentroDaFaixa && (
                                                    <div
                                                        className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-status-erro"
                                                        style={{ top: ((minutosAgora - HORA_INICIO * 60) / 60) * ALTURA_HORA }}
                                                        aria-hidden
                                                    >
                                                        <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-status-erro" />
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {modo === "mes" && (
                        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-border">
                            {DIAS_CURTOS.map((d) => (
                                <div key={d} className="bg-card p-2 text-center text-[11px] text-muted-foreground">{d}</div>
                            ))}
                            {(() => {
                                const primeiro = new Date(referencia.getFullYear(), referencia.getMonth(), 1)
                                const inicio = new Date(primeiro)
                                inicio.setDate(1 - primeiro.getDay())
                                return Array.from({ length: 42 }, (_, i) => {
                                    const d = new Date(inicio)
                                    d.setDate(inicio.getDate() + i)
                                    const chave = chaveDoDia(d)
                                    const doMes = d.getMonth() === referencia.getMonth()
                                    const lista = porDia.get(chave) ?? []
                                    return (
                                        <div key={chave} className={cn("min-h-[84px] space-y-1 bg-card p-1.5", !doMes && "opacity-40")}>
                                            <span className={cn(
                                                "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                                                chave === chaveHoje && "bg-primary font-semibold text-primary-foreground",
                                            )}>
                                                {d.getDate()}
                                            </span>
                                            {lista.slice(0, 2).map((t) => <BlocoTarefa key={t.id} tarefa={t} compacto />)}
                                            {lista.length > 2 && (
                                                <span className="block px-1 text-[10px] text-muted-foreground">+{lista.length - 2}</span>
                                            )}
                                        </div>
                                    )
                                })
                            })()}
                        </div>
                    )}

                    {modo === "agenda" && (
                        (() => {
                            const ordenadas = tarefas
                                .filter((t) => t.data_entrega)
                                .slice()
                                .sort((a, b) =>
                                    (a.data_entrega! + (a.horario ?? "")).localeCompare(b.data_entrega! + (b.horario ?? ""))
                                )
                            if (ordenadas.length === 0) {
                                return <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma tarefa com prazo.</p>
                            }
                            return (
                                <ul className="divide-y">
                                    {ordenadas.map((t) => (
                                        <li key={t.id}>
                                            <Link href={`/tarefas/${t.id}`} className="flex items-center gap-3 py-2.5 hover:text-primary">
                                                <span className="w-24 shrink-0 text-xs text-muted-foreground">
                                                    {dataCurta(t.data_entrega!)}
                                                    {t.horario && <span className="block">{t.horario.slice(0, 5)}</span>}
                                                </span>
                                                <span className="min-w-0 flex-1 truncate text-sm">{t.titulo}</span>
                                                {t.area && (
                                                    <Badge variant="secondary" className={classeDaCor(t.area.cor)}>{t.area.nome}</Badge>
                                                )}
                                                <Badge variant="secondary" className={TAREFA_STATUS[t.status].className}>
                                                    {TAREFA_STATUS[t.status].label}
                                                </Badge>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )
                        })()
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
