"use client"

import Link from "next/link"
import {
    ArrowRight, CalendarDays, CircleDollarSign, ClipboardList, Megaphone,
    MoreHorizontal, Pencil, Trash2, Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
    DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PilhaAvatares } from "@/components/painel/pilha-avatares"
import { Stepper } from "@/components/painel/stepper"
import { dataCurta } from "@/lib/constants/blog"
import {
    brl, CAMPANHA_ETAPA_LABEL, CAMPANHA_ETAPA_ORDEM, CAMPANHA_STATUS,
    CAMPANHA_STATUS_ORDEM, indiceDaEtapa, orcamentoDaCampanha,
} from "@/lib/constants/campanhas"
import type { CampanhaEtapa, CampanhaMetrica, CampanhaStatus } from "@/lib/db/types"
import { cn } from "@/lib/utils"
import { capaDaCampanha, type CampanhaDaLista } from "./tipos"

function Metrica({ icone, rotulo, valor, apoio, alerta }: {
    icone: React.ReactNode
    rotulo: string
    valor: string
    apoio?: string | null
    alerta?: boolean
}) {
    return (
        <div className="flex min-w-0 items-start gap-2">
            <span className="mt-0.5 shrink-0 text-muted-foreground">{icone}</span>
            <div className="min-w-0 leading-tight">
                <p className="truncate text-[11px] text-muted-foreground">{rotulo}</p>
                <p className="truncate text-sm font-medium">{valor}</p>
                {apoio && (
                    <p className={cn("truncate text-[11px]", alerta ? "text-status-erro" : "text-status-sucesso")}>
                        {apoio}
                    </p>
                )}
            </div>
        </div>
    )
}

export function CardCampanha({ campanha, metrica, equipe, onEditar, onExcluir, onStatus, onEtapa }: {
    campanha: CampanhaDaLista
    metrica?: CampanhaMetrica
    /** Creators/responsáveis para a pilha de avatares do rodapé. */
    equipe: { nome?: string | null; email?: string | null; avatar_url?: string | null }[]
    onEditar: (c: CampanhaDaLista) => void
    onExcluir: (c: CampanhaDaLista) => void
    onStatus: (c: CampanhaDaLista, s: CampanhaStatus) => void
    onEtapa: (c: CampanhaDaLista, e: CampanhaEtapa) => void
}) {
    const capa = capaDaCampanha(campanha)
    const status = CAMPANHA_STATUS[campanha.status]
    const orcamento = orcamentoDaCampanha(campanha)

    const pendentes = Number(metrica?.tarefas_pendentes ?? 0)
    const vencidas = Number(metrica?.tarefas_vencidas ?? 0)
    const mapeados = Number(metrica?.creators_mapeados ?? 0)
    const aprovados = Number(metrica?.creators_aprovados ?? 0)

    return (
        <Card className="rounded-2xl border-border/60 transition-colors hover:border-primary/40">
            <CardContent className="space-y-4 p-4 sm:p-5">
                {/* ---------- identidade ---------- */}
                <div className="flex items-start gap-3">
                    {capa ? (
                        // <img> e não next/image: a URL vem do storage ou do logo do
                        // cliente, e o projeto não declara images.remotePatterns.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={capa} alt="" className="h-16 w-16 shrink-0 rounded-xl bg-muted object-cover" />
                    ) : (
                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                            <Megaphone className="h-6 w-6" />
                        </span>
                    )}

                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <Link
                                    href={`/campanhas/${campanha.id}`}
                                    className="block truncate text-base font-bold uppercase leading-tight tracking-tight hover:text-primary"
                                    title={campanha.nome}
                                >
                                    {campanha.nome}
                                </Link>
                                <p className="truncate text-sm text-muted-foreground">
                                    {campanha.cliente?.nome ?? "Sem cliente"}
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                                <Badge variant="secondary" className={status.className}>{status.label}</Badge>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon-sm" aria-label={`Ações de ${campanha.nome}`} title="Mais ações">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52">
                                        <DropdownMenuItem onClick={() => onEditar(campanha)}>
                                            <Pencil className="h-4 w-4" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                <ClipboardList className="h-4 w-4" /> Mudar etapa
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                {CAMPANHA_ETAPA_ORDEM.map((e) => (
                                                    <DropdownMenuItem key={e} disabled={e === campanha.etapa} onClick={() => onEtapa(campanha, e)}>
                                                        {CAMPANHA_ETAPA_LABEL[e]}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                <Megaphone className="h-4 w-4" /> Mudar status
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                {CAMPANHA_STATUS_ORDEM.map((s) => (
                                                    <DropdownMenuItem key={s} disabled={s === campanha.status} onClick={() => onStatus(campanha, s)}>
                                                        {CAMPANHA_STATUS[s].label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem variant="destructive" onClick={() => onExcluir(campanha)}>
                                            <Trash2 className="h-4 w-4" /> Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {(campanha.tagline || campanha.objetivo) && (
                            <p className="mt-1.5 line-clamp-1 text-sm text-muted-foreground">
                                {campanha.tagline ?? campanha.objetivo}
                            </p>
                        )}
                    </div>
                </div>

                {/* ---------- funil ---------- */}
                <Stepper
                    etapas={CAMPANHA_ETAPA_ORDEM.map((e) => CAMPANHA_ETAPA_LABEL[e])}
                    atual={indiceDaEtapa(campanha.etapa)}
                />

                {/* ---------- números ---------- */}
                <div className="grid grid-cols-2 gap-4 border-t pt-4 lg:grid-cols-4">
                    <Metrica
                        icone={<Users className="h-4 w-4" />}
                        rotulo="Creators"
                        valor={`${mapeados} mapeado${mapeados === 1 ? "" : "s"}`}
                        apoio={aprovados > 0 ? `${aprovados} aprovado${aprovados === 1 ? "" : "s"}` : null}
                    />
                    <Metrica
                        icone={<ClipboardList className="h-4 w-4" />}
                        rotulo="Tarefas"
                        valor={`${pendentes} pendente${pendentes === 1 ? "" : "s"}`}
                        apoio={vencidas > 0 ? `${vencidas} vencida${vencidas === 1 ? "" : "s"}` : null}
                        alerta={vencidas > 0}
                    />
                    <Metrica
                        icone={<CircleDollarSign className="h-4 w-4" />}
                        rotulo={orcamento?.rotulo ?? "Orçamento"}
                        valor={orcamento ? brl(orcamento.valor) : "—"}
                    />
                    <Metrica
                        icone={<CalendarDays className="h-4 w-4" />}
                        rotulo="Prazo final"
                        valor={campanha.data_fim ? dataCurta(campanha.data_fim) : "—"}
                        apoio={metrica?.proxima_entrega ? `Próxima entrega: ${dataCurta(metrica.proxima_entrega)}` : null}
                    />
                </div>

                {/* ---------- rodapé ---------- */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <PilhaAvatares pessoas={equipe} />
                        <div className="min-w-0 leading-tight">
                            <p className="text-[11px] text-muted-foreground">Responsável</p>
                            <p className="truncate text-sm font-medium">
                                {campanha.dono?.nome ?? campanha.dono?.email ?? "Sem responsável"}
                            </p>
                        </div>
                    </div>

                    <Link
                        href={`/campanhas/${campanha.id}`}
                        className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                        Abrir campanha
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
