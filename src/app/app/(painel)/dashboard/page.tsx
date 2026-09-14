"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
    AlertTriangle, Building2, CheckCircle2, ClipboardList, Clock,
    FileSignature, Loader2, MapPin, Megaphone, Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownSelect } from "@/components/ui/dropdown-select"
import { Progress } from "@/components/ui/progress"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { FeedAtividade, type ItemAtividade } from "@/components/painel/feed-atividade"
import { MetricaCard, variacaoPercentual } from "@/components/painel/metrica-card"
import { UserAvatar } from "@/components/tarefas/user-picker"
import { MapaTerritorio } from "@/components/public/mapa-territorio"
import { useProfiles } from "@/hooks/use-profiles"
import { dataCurta } from "@/lib/constants/blog"
import { CAMPANHA_STATUS, CAMPANHA_STATUS_ATIVOS } from "@/lib/constants/campanhas"
import { TAREFA_STATUS_ABERTOS } from "@/lib/constants/tarefas"
import { REGIOES, UFS } from "@/lib/constants/uf"
import { createClient } from "@/lib/supabase/client"
import type { CampanhaStatus, ClienteStatus, TarefaStatus } from "@/lib/db/types"
import { cn } from "@/lib/utils"

type CampanhaDash = {
    id: string
    nome: string
    status: CampanhaStatus
    etapa: string
    data_fim: string | null
    capa_url: string | null
    responsavel: string | null
    created_at: string
    cliente: { nome: string; logo_url: string | null } | null
}

type TarefaDash = {
    id: string
    titulo: string
    status: TarefaStatus
    data_entrega: string | null
    horario: string | null
    responsavel: string | null
    campanha: { id: string; nome: string } | null
}

/** Próxima ação sugerida para a campanha, pela etapa em que ela está. */
const ACAO_POR_ETAPA: Record<string, string> = {
    briefing: "Ver briefing",
    mapeamento: "Acompanhar",
    aprovacao: "Revisar",
    producao: "Acompanhar",
    relatorio: "Ver relatório",
}

export default function DashboardPage() {
    const [supabase] = useState(() => createClient())
    const { profiles } = useProfiles()

    const [clientes, setClientes] = useState<{ status: ClienteStatus; created_at: string }[]>([])
    const [campanhas, setCampanhas] = useState<CampanhaDash[]>([])
    const [tarefas, setTarefas] = useState<TarefaDash[]>([])
    const [criadores, setCriadores] = useState<{ estado: string | null; created_at: string }[]>([])
    const [contratos, setContratos] = useState<{ status: string }[]>([])
    const [atividades, setAtividades] = useState<ItemAtividade[]>([])
    const [loading, setLoading] = useState(true)
    const [falhaSchema, setFalhaSchema] = useState(false)
    const [agora, setAgora] = useState(0)
    const [regiao, setRegiao] = useState("norte-nordeste")

    async function carregar() {
        setLoading(true)
        setAgora(Date.now())

        const [cls, camps, ts, infl, cts, atvs] = await Promise.all([
            supabase.from("somos_preta_clientes").select("status, created_at").limit(2000),
            supabase.from("somos_preta_campanhas")
                .select("id, nome, status, etapa, data_fim, capa_url, responsavel, created_at, cliente:somos_preta_clientes(nome, logo_url)")
                .limit(500),
            supabase.from("somos_preta_tarefas")
                .select("id, titulo, status, data_entrega, horario, responsavel, campanha:somos_preta_campanhas(id, nome)")
                .eq("arquivada", false).limit(2000),
            supabase.from("somos_preta_influencers").select("estado, created_at").limit(5000),
            supabase.from("somos_preta_contratos").select("status").limit(2000),
            supabase.from("somos_preta_atividades")
                .select("*, autor:somos_preta_profiles!autor_id(nome, email, avatar_url)")
                .order("created_at", { ascending: false }).limit(8),
        ])

        if (cls.error) { setFalhaSchema(true); setLoading(false); return }

        setFalhaSchema(false)
        setClientes((cls.data ?? []) as { status: ClienteStatus; created_at: string }[])
        if (!camps.error) setCampanhas((camps.data ?? []) as unknown as CampanhaDash[])
        if (!ts.error) setTarefas((ts.data ?? []) as unknown as TarefaDash[])
        if (!infl.error) setCriadores((infl.data ?? []) as { estado: string | null; created_at: string }[])
        if (!cts.error) setContratos((cts.data ?? []) as { status: string }[])
        if (!atvs.error) setAtividades((atvs.data ?? []) as unknown as ItemAtividade[])
        setLoading(false)
    }

    useEffect(() => {
        carregar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const profilesById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles])
    const hoje = useMemo(() => new Date(agora || 0).toISOString().slice(0, 10), [agora])
    const trintaDias = agora - 30 * 24 * 60 * 60 * 1000
    const sessentaDias = agora - 60 * 24 * 60 * 60 * 1000

    // --------------------------------------------------------------- métricas

    const clientesAtivos = clientes.filter((c) => c.status === "ativo").length
    const campanhasAtivas = campanhas.filter((c) => CAMPANHA_STATUS_ATIVOS.includes(c.status))
    const tarefasAbertas = tarefas.filter((t) => TAREFA_STATUS_ABERTOS.includes(t.status))
    const vencemHoje = tarefasAbertas.filter((t) => t.data_entrega === hoje).length

    const ufsDaRegiao = useMemo(() => {
        const alvo = REGIOES.find((r) => r.valor === regiao)?.ufs ?? []
        return new Set(UFS.filter((u) => alvo.includes(u.regiao)).map((u) => u.sigla))
    }, [regiao])

    const criadoresDaRegiao = useMemo(
        () => criadores.filter((c) => {
            const uf = c.estado?.trim().toUpperCase()
            return uf && ufsDaRegiao.has(uf)
        }),
        [criadores, ufsDaRegiao]
    )

    /**
     * Aprovações pendentes não é tabela: é a união de três filas que já existem
     * — tarefa esperando aprovação, contrato não assinado e campanha em
     * aprovação. Criar uma tabela para isso seria inventar burocracia.
     */
    const aprovacoesPendentes =
        tarefas.filter((t) => t.status === "aguardando_aprovacao").length
        + contratos.filter((c) => c.status === "pendente").length
        + campanhas.filter((c) => c.status === "em_aprovacao").length

    function novosNoPeriodo(itens: { created_at: string }[], de: number, ate: number) {
        if (agora === 0) return 0
        return itens.filter((i) => {
            const t = new Date(i.created_at).getTime()
            return t >= de && t < ate
        }).length
    }

    // ---------------------------------------------------------- densidade

    const densidade = useMemo(() => {
        const contagem = new Map<string, number>()
        for (const c of criadoresDaRegiao) {
            const uf = c.estado!.trim().toUpperCase()
            contagem.set(uf, (contagem.get(uf) ?? 0) + 1)
        }
        const total = [...contagem.values()].reduce((a, b) => a + b, 0)
        const ordenado = [...contagem.entries()].sort((a, b) => b[1] - a[1])
        const topo = ordenado.slice(0, 5)
        const resto = ordenado.slice(5).reduce((n, [, v]) => n + v, 0)

        const linhas = topo.map(([uf, n]) => ({
            uf, n, pct: total > 0 ? (n / total) * 100 : 0,
        }))
        if (resto > 0) linhas.push({ uf: "Outros", n: resto, pct: total > 0 ? (resto / total) * 100 : 0 })

        return { linhas, total }
    }, [criadoresDaRegiao])

    // ------------------------------------------------- prioridades de hoje

    const prioridades = useMemo(() => {
        const itens: {
            id: string; severidade: "alta" | "media" | "baixa"
            titulo: string; descricao: string; quando: string
            acao: string; href: string
        }[] = []

        for (const t of tarefasAbertas.filter((t) => t.data_entrega && t.data_entrega <= hoje).slice(0, 3)) {
            const atrasada = t.data_entrega! < hoje
            itens.push({
                id: t.id,
                severidade: atrasada ? "alta" : "media",
                titulo: atrasada ? "Tarefa atrasada" : "Tarefa vence hoje",
                descricao: `${t.titulo}${t.campanha ? ` · ${t.campanha.nome}` : ""}`,
                quando: atrasada ? `Venceu ${dataCurta(t.data_entrega!)}` : `Hoje${t.horario ? `, ${t.horario.slice(0, 5)}` : ""}`,
                acao: "Resolver",
                href: `/tarefas/${t.id}`,
            })
        }

        for (const c of campanhas.filter((c) => c.status === "em_aprovacao").slice(0, 2)) {
            itens.push({
                id: c.id,
                severidade: "alta",
                titulo: "Campanha aguardando aprovação",
                descricao: `${c.nome}${c.cliente ? ` · ${c.cliente.nome}` : ""}`,
                quando: "Parada",
                acao: "Revisar",
                href: `/campanhas/${c.id}`,
            })
        }

        for (const c of campanhas.filter((c) => !c.responsavel && CAMPANHA_STATUS_ATIVOS.includes(c.status)).slice(0, 2)) {
            itens.push({
                id: `sem-dono-${c.id}`,
                severidade: "baixa",
                titulo: "Campanha sem responsável",
                descricao: c.nome,
                quando: "—",
                acao: "Atribuir",
                href: `/campanhas/${c.id}`,
            })
        }

        return itens.slice(0, 5)
    }, [tarefasAbertas, campanhas, hoje])

    const emAndamento = useMemo(
        () => campanhasAtivas
            .slice()
            .sort((a, b) => (a.data_fim ?? "9999").localeCompare(b.data_fim ?? "9999"))
            .slice(0, 5),
        [campanhasAtivas]
    )

    const COR_SEVERIDADE = {
        alta: "bg-status-erro/12 text-status-erro",
        media: "bg-status-atencao/12 text-status-atencao",
        baixa: "bg-status-info/12 text-status-info",
    }

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-160px)] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight">Visão geral</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Acompanhe o progresso das suas campanhas, criadores e tarefas em um só lugar.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <DropdownSelect
                        value={regiao}
                        onValueChange={setRegiao}
                        aria-label="Região"
                        className="w-[190px]"
                        options={REGIOES.map((r) => ({ value: r.valor, label: r.label }))}
                    />
                </div>
            </div>

            {falhaSchema ? (
                <Card className="border-status-atencao/40 bg-status-atencao/5">
                    <CardContent className="flex items-start gap-3 p-5">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-status-atencao" />
                        <div className="text-sm">
                            <p className="font-medium">O dashboard precisa das migrations do painel.</p>
                            <p className="mt-1 text-muted-foreground">
                                Aplique <code className="rounded bg-muted px-1 py-0.5 text-xs">0019_painel_enums.sql</code> e{" "}
                                <code className="rounded bg-muted px-1 py-0.5 text-xs">0020_painel_operacao.sql</code>, nessa ordem.
                            </p>
                            <Button variant="outline" size="sm" className="mt-3 rounded-xl" onClick={carregar}>Tentar de novo</Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                        <MetricaCard
                            icone={<Building2 className="h-5 w-5" />} cor="bg-status-sucesso/12 text-status-sucesso"
                            valor={clientesAtivos} rotulo="Clientes ativos"
                            variacao={variacaoPercentual(
                                novosNoPeriodo(clientes, trintaDias, agora),
                                novosNoPeriodo(clientes, sessentaDias, trintaDias),
                            )}
                            detalhe={`${clientesAtivos === 1 ? "1 conta ativa" : `${clientesAtivos} contas ativas`}`}
                            href="/clientes" hrefLabel="Ver clientes →"
                        />
                        <MetricaCard
                            icone={<Megaphone className="h-5 w-5" />} cor="bg-primary/12 text-primary"
                            valor={campanhasAtivas.length} rotulo="Campanhas ativas"
                            variacao={variacaoPercentual(
                                novosNoPeriodo(campanhas, trintaDias, agora),
                                novosNoPeriodo(campanhas, sessentaDias, trintaDias),
                            )}
                            detalhe={campanhasAtivas.length === 0 ? "Nenhuma em andamento" : undefined}
                            href="/campanhas" hrefLabel="Ver campanhas →"
                        />
                        <MetricaCard
                            icone={<ClipboardList className="h-5 w-5" />} cor="bg-status-info/12 text-status-info"
                            valor={tarefasAbertas.length} rotulo="Tarefas pendentes"
                            detalhe={vencemHoje > 0 ? `${vencemHoje} ${vencemHoje === 1 ? "vence" : "vencem"} hoje` : "Nada vence hoje"}
                            destaque={vencemHoje > 0 ? "atencao" : undefined}
                            href="/tarefas" hrefLabel="Ver tarefas →"
                        />
                        <MetricaCard
                            icone={<Users className="h-5 w-5" />} cor="bg-status-progresso/12 text-status-progresso"
                            valor={criadoresDaRegiao.length.toLocaleString("pt-BR")} rotulo="Criadores na base"
                            variacao={variacaoPercentual(
                                novosNoPeriodo(criadoresDaRegiao, trintaDias, agora),
                                novosNoPeriodo(criadoresDaRegiao, sessentaDias, trintaDias),
                            )}
                            detalhe={`+${novosNoPeriodo(criadoresDaRegiao, trintaDias, agora)} este mês`}
                            href="/criadores" hrefLabel="Ver criadores →"
                        />
                        <MetricaCard
                            icone={<FileSignature className="h-5 w-5" />} cor="bg-status-atencao/12 text-status-atencao"
                            valor={aprovacoesPendentes} rotulo="Aprovações pendentes"
                            detalhe="Tarefas, contratos e campanhas"
                            href="/contratos" hrefLabel="Ver aprovações →"
                        />
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                        {/* ---------- prioridades ---------- */}
                        <Card className="rounded-2xl">
                            <CardContent className="p-4 sm:p-5">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="flex items-center gap-2 text-sm font-semibold">
                                            Prioridades de hoje
                                            <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1">
                                                {prioridades.length}
                                            </Badge>
                                        </p>
                                        <p className="text-xs text-muted-foreground">Itens que precisam da sua atenção hoje.</p>
                                    </div>
                                    <Link href="/tarefas" className="text-xs font-medium text-primary hover:underline">Ver todas</Link>
                                </div>

                                {prioridades.length === 0 ? (
                                    <div className="py-10 text-center">
                                        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-status-sucesso/50" />
                                        <p className="text-sm font-medium">Nada urgente por aqui</p>
                                        <p className="text-xs text-muted-foreground">Sem prazos vencendo nem aprovações paradas.</p>
                                    </div>
                                ) : (
                                    <ul className="mt-3 divide-y">
                                        {prioridades.map((p) => (
                                            <li key={p.id} className="flex items-center gap-3 py-3">
                                                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", COR_SEVERIDADE[p.severidade])}>
                                                    <Clock className="h-4 w-4" />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">{p.titulo}</p>
                                                    <p className="truncate text-xs text-muted-foreground">{p.descricao}</p>
                                                </div>
                                                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{p.quando}</span>
                                                <Button asChild size="sm" variant="outline" className="shrink-0 rounded-xl">
                                                    <Link href={p.href}>{p.acao}</Link>
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        {/* ---------- campanhas em andamento ---------- */}
                        <Card className="rounded-2xl">
                            <CardContent className="p-4 sm:p-5">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold">Campanhas em andamento</p>
                                        <p className="text-xs text-muted-foreground">Acompanhe o status das campanhas ativas.</p>
                                    </div>
                                    <Link href="/campanhas" className="text-xs font-medium text-primary hover:underline">Ver todas</Link>
                                </div>

                                {emAndamento.length === 0 ? (
                                    <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma campanha ativa no momento.</p>
                                ) : (
                                    <div className="mt-3 overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Campanha</TableHead>
                                                    <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="hidden lg:table-cell">Prazo</TableHead>
                                                    <TableHead className="hidden xl:table-cell">Responsável</TableHead>
                                                    <TableHead className="text-right">Próxima ação</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {emAndamento.map((c) => {
                                                    const dono = c.responsavel ? profilesById.get(c.responsavel) : null
                                                    const capa = c.capa_url ?? c.cliente?.logo_url
                                                    return (
                                                        <TableRow key={c.id}>
                                                            <TableCell className="max-w-[180px] font-medium">
                                                                <Link href={`/campanhas/${c.id}`} className="flex items-center gap-2 hover:text-primary">
                                                                    {capa ? (
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        <img src={capa} alt="" className="h-7 w-7 shrink-0 rounded-lg bg-muted object-cover" />
                                                                    ) : (
                                                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                                                            <Megaphone className="h-3 w-3" />
                                                                        </span>
                                                                    )}
                                                                    <span className="truncate">{c.nome}</span>
                                                                </Link>
                                                            </TableCell>
                                                            <TableCell className="hidden sm:table-cell text-muted-foreground">
                                                                {c.cliente?.nome ?? "—"}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="secondary" className={CAMPANHA_STATUS[c.status].className}>
                                                                    {CAMPANHA_STATUS[c.status].label}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className={cn(
                                                                "hidden lg:table-cell",
                                                                c.data_fim && c.data_fim < hoje && "text-status-erro",
                                                            )}>
                                                                {c.data_fim ? dataCurta(c.data_fim) : "—"}
                                                            </TableCell>
                                                            <TableCell className="hidden xl:table-cell">
                                                                {dono ? (
                                                                    <span className="flex items-center gap-2">
                                                                        <UserAvatar profile={dono} />
                                                                        <span className="truncate text-sm">{dono.nome ?? dono.email}</span>
                                                                    </span>
                                                                ) : <span className="text-muted-foreground">—</span>}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button asChild size="sm" variant="outline" className="rounded-xl">
                                                                    <Link href={`/campanhas/${c.id}`}>
                                                                        {ACAO_POR_ETAPA[c.etapa] ?? "Abrir"}
                                                                    </Link>
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                        {/* ---------- densidade regional ---------- */}
                        <Card className="rounded-2xl">
                            <CardContent className="p-4 sm:p-5">
                                <p className="text-sm font-semibold">Densidade regional</p>
                                <p className="text-xs text-muted-foreground">
                                    Criadores por estado • {densidade.total.toLocaleString("pt-BR")} no total
                                </p>

                                {densidade.linhas.length === 0 ? (
                                    <p className="py-10 text-center text-sm text-muted-foreground">
                                        Nenhum criador com estado preenchido nesta região.
                                    </p>
                                ) : (
                                    <div className="mt-4 grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                                        {/*
                                          Silhueta do território, não um mapa por estado: o projeto
                                          não tem geometria estadual, e desenhar um choropleth
                                          aproximado seria dizer um dado que não existe. O número
                                          fica nas barras, que é onde ele é legível mesmo.
                                        */}
                                        <MapaTerritorio className="mx-auto hidden h-32 w-auto text-primary/25 sm:block" />

                                        <ul className="space-y-2.5">
                                            {densidade.linhas.map((l) => (
                                                <li key={l.uf} className="flex items-center gap-3">
                                                    <span className="w-12 shrink-0 text-xs font-medium">{l.uf}</span>
                                                    <Progress value={l.pct} className="h-2 flex-1" />
                                                    <span className="w-10 shrink-0 text-right text-xs tabular-nums">{l.n}</span>
                                                    <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                                                        {l.pct.toFixed(1)}%
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* ---------- atividade recente ---------- */}
                        <Card className="rounded-2xl">
                            <CardContent className="p-4 sm:p-5">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold">Atividade recente</p>
                                        <p className="text-xs text-muted-foreground">Últimas ações na plataforma.</p>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <FeedAtividade
                                        itens={atividades}
                                        vazio="O feed começa a registrar a partir da próxima movimentação."
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    )
}
