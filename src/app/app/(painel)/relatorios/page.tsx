"use client"

import { useEffect, useState, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts"
import { Loader2, DollarSign, Megaphone, Users, CheckCircle2, CalendarRange, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownSelect } from "@/components/ui/dropdown-select"
import { ErroDeCarregamento } from "@/components/painel/erro-de-carregamento"
import { lidos } from "@/lib/supabase/resultado"
import { brl, CAMPANHA_STATUS_ATIVOS, orcamentoDaCampanha } from "@/lib/constants/campanhas"
import { cn } from "@/lib/utils"
import type { CampanhaStatus } from "@/lib/db/types"

const brlShort = (v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`

// O PostgREST corta a resposta sem avisar. Pedindo o total junto das linhas dá
// para dizer que a soma saiu parcial, em vez de apresentar número curto como final.
const LIMITE_CAMPANHAS = 1000
const TOPO_DO_RANKING = 5

type Periodo = "30" | "90" | "ano" | "todos"

const PERIODOS: { value: Periodo; label: string }[] = [
    { value: "30", label: "Últimos 30 dias" },
    { value: "90", label: "Últimos 90 dias" },
    { value: "ano", label: "Este ano" },
    { value: "todos", label: "Todo o período" },
]

const rotuloDoPeriodo = (p: Periodo) => PERIODOS.find((o) => o.value === p)!.label

/**
 * Borda de início do recorte, em ISO, ou null para "todo o período".
 *
 * O corte morde `created_at` da campanha, e não data_inicio/data_fim: só
 * created_at existe em toda campanha. As outras duas são opcionais, e filtrar
 * por elas tiraria do relatório — calado — todo trabalho ainda sem datas
 * marcadas, que é justamente o que costuma estar em planejamento.
 */
function inicioDoPeriodo(periodo: Periodo, agora: number) {
    if (periodo === "todos") return null
    if (periodo === "ano") return new Date(new Date(agora).getFullYear(), 0, 1).toISOString()
    return new Date(agora - Number(periodo) * 24 * 60 * 60 * 1000).toISOString()
}

type CampanhaDoRelatorio = {
    status: CampanhaStatus
    orcamento_estimado: number | null
    orcamento_aprovado: number | null
    orcamento_final: number | null
    budget: number
    cliente: { nome: string } | null
}

type Data = {
    orcamentoTotal: number
    campanhasAtivas: number
    campanhasTruncadas: boolean
    influencers: number
    tarefasConcluidas: number
    porCliente: { name: string; orcamento: number }[]
    topInfluencers: { name: string; engagement: number }[]
    // O recorte que produziu estes números, não o que está no seletor: entre
    // trocar a opção e a resposta chegar, os dois divergem.
    periodo: Periodo
    desde: string | null
}

export default function AnalyticsPage() {
    const [supabase] = useState(() => createClient())
    const [data, setData] = useState<Data | null>(null)
    const [carregando, setCarregando] = useState(true)
    const [erroCarga, setErroCarga] = useState(false)
    const [periodo, setPeriodo] = useState<Periodo>("todos")

    async function carregar(recorte: Periodo) {
        setCarregando(true)
        setErroCarga(false)

        // Relógio lido aqui, fora do render: a regra de pureza barra Date.now()
        // no corpo do componente, e a borda do recorte precisa ficar parada
        // enquanto os números dela estiverem na tela.
        const desde = inicioDoPeriodo(recorte, Date.now())

        try {
            // O corte vai na consulta, antes de order/limit: filtrar depois, no
            // cliente, recortaria apenas as LIMITE_CAMPANHAS que couberam na
            // página, e o número sairia menor do que a base tem para o período.
            const consultaCampanhas = supabase.from("somos_preta_campanhas")
                .select(
                    "status, orcamento_estimado, orcamento_aprovado, orcamento_final, budget, cliente:somos_preta_clientes(nome)",
                    { count: "exact" },
                )
            const campanhasDoRecorte = desde ? consultaCampanhas.gte("created_at", desde) : consultaCampanhas

            const [camps, totalCriadores, ranking, tarefas] = await Promise.all([
                campanhasDoRecorte.order("created_at", { ascending: false }).limit(LIMITE_CAMPANHAS),
                supabase.from("somos_preta_influencers").select("*", { count: "exact", head: true }),
                // O ranking sai ordenado do banco: assim o primeiro lugar é o primeiro
                // lugar da base inteira, e não o maior das linhas que couberam.
                supabase.from("somos_preta_influencers").select("nome, engagement")
                    .order("engagement", { ascending: false }).limit(TOPO_DO_RANKING),
                supabase.from("somos_preta_tarefas").select("*", { count: "exact", head: true })
                    .eq("status", "concluida").eq("arquivada", false),
            ])

            const campanhas = lidos(camps) as CampanhaDoRelatorio[] | null
            const criadoresDoTopo = lidos(ranking) as { nome: string; engagement: number }[] | null

            if (!campanhas || !criadoresDoTopo || totalCriadores.error || tarefas.error) {
                setErroCarga(true)
                return
            }

            // Campanha cancelada não é dinheiro sob gestão: continuaria inflando o
            // total e distribuindo orçamento inexistente entre as contas do gráfico.
            const vigentes = campanhas.filter((c) => c.status !== "cancelada")
            const orcamentoDe = (c: CampanhaDoRelatorio) => orcamentoDaCampanha(c)?.valor ?? 0

            const porClienteMap = new Map<string, number>()
            for (const c of vigentes) {
                const nome = c.cliente?.nome ?? "Sem cliente"
                porClienteMap.set(nome, (porClienteMap.get(nome) ?? 0) + orcamentoDe(c))
            }

            setData({
                orcamentoTotal: vigentes.reduce((s, c) => s + orcamentoDe(c), 0),
                campanhasAtivas: campanhas.filter((c) => CAMPANHA_STATUS_ATIVOS.includes(c.status)).length,
                campanhasTruncadas: (camps.count ?? 0) > campanhas.length,
                influencers: totalCriadores.count ?? 0,
                tarefasConcluidas: tarefas.count ?? 0,
                porCliente: [...porClienteMap.entries()]
                    .map(([name, orcamento]) => ({ name, orcamento }))
                    .sort((a, b) => b.orcamento - a.orcamento).slice(0, 6),
                topInfluencers: criadoresDoTopo.map((i) => ({ name: i.nome, engagement: Number(i.engagement) })),
                periodo: recorte,
                desde,
            })
        } catch {
            setErroCarga(true)
        } finally {
            setCarregando(false)
        }
    }

    useEffect(() => {
        carregar(periodo)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function trocarPeriodo(novo: Periodo) {
        setPeriodo(novo)
        carregar(novo)
    }

    const cabecalho = (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                <h2 className="text-2xl font-bold tracking-tight">Analytics & Insights</h2>
                <p className="text-sm text-muted-foreground">Desempenho consolidado a partir dos dados reais do hub.</p>
            </div>
            <div className="flex items-center gap-2">
                <DropdownSelect
                    value={periodo}
                    onValueChange={(v) => trocarPeriodo(v as Periodo)}
                    aria-label="Período do relatório"
                    className="w-[180px]"
                    disabled={carregando}
                    options={PERIODOS.map((p) => ({ value: p.value, label: p.label }))}
                />
                <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => carregar(periodo)}
                    disabled={carregando}
                >
                    <RefreshCw className={cn("h-4 w-4", carregando && "animate-spin")} /> Atualizar
                </Button>
            </div>
        </div>
    )

    if (carregando && !data) {
        return <div className="flex items-center justify-center py-24 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
    }

    if (erroCarga || !data) {
        return (
            <div className="flex flex-col gap-6">
                {cabecalho}
                <ErroDeCarregamento recurso="os números do relatório" onTentarDeNovo={() => carregar(periodo)} />
            </div>
        )
    }

    const recorteDoOrcamento = data.campanhasTruncadas
        ? `Parcial: as ${LIMITE_CAMPANHAS} campanhas mais recentes`
        : "Valor mais definitivo de cada campanha, sem as canceladas"

    const semCampanhas = data.periodo === "todos" ? "Sem campanhas ainda" : "Sem campanhas no período"

    const kpis: { label: string; value: string; nota?: string; icon: ReactNode; border: string }[] = [
        { label: "Orçamento sob gestão", value: brl(data.orcamentoTotal), nota: recorteDoOrcamento, icon: <DollarSign className="h-4 w-4" />, border: "border-l-primary" },
        { label: "Campanhas ativas", value: String(data.campanhasAtivas), nota: "Planejamento, em aprovação e em andamento", icon: <Megaphone className="h-4 w-4" />, border: "border-l-blue-500" },
        { label: "Influenciadores", value: String(data.influencers), nota: "Total da base, fora do recorte", icon: <Users className="h-4 w-4" />, border: "border-l-orange-500" },
        { label: "Tarefas concluídas", value: String(data.tarefasConcluidas), nota: "Sem as arquivadas, fora do recorte", icon: <CheckCircle2 className="h-4 w-4" />, border: "border-l-green-500" },
    ]

    const tooltipStyle = {
        borderRadius: "12px", border: "1px solid var(--border)",
        backgroundColor: "var(--popover)", fontSize: "12px", padding: "8px 12px",
    }

    return (
        <div className="flex flex-col gap-6" aria-busy={carregando}>
            {cabecalho}

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {kpis.map((k) => (
                    <Card key={k.label} className={`border-l-4 ${k.border} rounded-2xl`}>
                        <CardHeader className="pb-2 p-4">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs">{k.label}</CardDescription>
                                <span className="text-muted-foreground">{k.icon}</span>
                            </div>
                            <CardTitle className="text-xl lg:text-2xl font-bold">{k.value}</CardTitle>
                            {k.nota && <p className="text-[11px] leading-tight text-muted-foreground">{k.nota}</p>}
                        </CardHeader>
                    </Card>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <CalendarRange className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>
                    Recorte: {rotuloDoPeriodo(data.periodo).toLowerCase()}
                    {data.desde && ` — campanhas criadas a partir de ${new Date(data.desde).toLocaleDateString("pt-BR")}`}
                </span>
                <span>· Influenciadores e tarefas concluídas são totais da base.</span>
            </div>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-7">
                <Card className="lg:col-span-4 rounded-2xl">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base lg:text-lg">Orçamento por cliente</CardTitle>
                        <CardDescription className="text-xs">{recorteDoOrcamento}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] p-2 sm:p-4 pt-0">
                        {data.porCliente.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">{semCampanhas}</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                {/* Barra deitada, como o cartão de Top influenciadores ao
                                    lado. Em pé, com seis clientes num celular de 360px, cada
                                    faixa do eixo X ficava com ~50px e os nomes se sobrepunham
                                    até virar borrão. Deitada, cada cliente ganha uma linha
                                    própria e nenhum rótulo colide com o vizinho. */}
                                <BarChart data={data.porCliente} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={brlShort} />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={80} interval={0} tickFormatter={(v: string) => v.length > 12 ? `${v.substring(0, 12)}...` : v} />
                                    <Tooltip contentStyle={tooltipStyle} formatter={(v?: number) => brl(Number(v ?? 0))} cursor={{ fill: "color-mix(in srgb, var(--muted) 20%, transparent)" }} />
                                    <Bar dataKey="orcamento" name="Orçamento" radius={[0, 4, 4, 0]} fill="var(--primary)" barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 rounded-2xl">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base lg:text-lg">Top influenciadores</CardTitle>
                        <CardDescription className="text-xs">Ranking por engajamento</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] p-2 sm:p-4 pt-0">
                        {data.topInfluencers.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem influenciadores ainda</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.topInfluencers} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={80} tickFormatter={(v: string) => v.length > 12 ? `${v.substring(0, 12)}...` : v} />
                                    <Tooltip contentStyle={tooltipStyle} formatter={(v?: number) => `${Number(v ?? 0)}%`} cursor={{ fill: "color-mix(in srgb, var(--muted) 20%, transparent)" }} />
                                    <Bar dataKey="engagement" name="Engajamento" radius={[0, 4, 4, 0]} barSize={20}>
                                        {data.topInfluencers.map((_, i) => (
                                            <Cell key={i} fill={i === 0 ? "var(--primary)" : "var(--muted)"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
