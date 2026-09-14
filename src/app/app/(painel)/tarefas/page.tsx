"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
    AlertTriangle, CalendarDays, CheckCircle2, ClipboardList, Clock, Inbox,
    Loader2, Plus, Timer, TriangleAlert, UserRound,
} from "lucide-react"
import { toast } from "sonner"

import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BarraFiltros } from "@/components/painel/barra-filtros"
import { FeedAtividade, type ItemAtividade } from "@/components/painel/feed-atividade"
import { MetricaCard } from "@/components/painel/metrica-card"
import { Paginacao } from "@/components/painel/paginacao"
import { UserAvatar } from "@/components/tarefas/user-picker"
import { useProfiles } from "@/hooks/use-profiles"
import { dataCurta } from "@/lib/constants/blog"
import {
    TAREFA_PRIORIDADE, TAREFA_STATUS, TAREFA_STATUS_ABERTOS,
    TAREFA_STATUS_ORDEM, tarefaPrazoBadge,
} from "@/lib/constants/tarefas"
import { createClient } from "@/lib/supabase/client"
import type { Area, TarefaMetrica, TarefaPrioridade, TarefaStatus } from "@/lib/db/types"
import { cn } from "@/lib/utils"
import { Board } from "./board"
import { Calendario } from "./calendario"
import { ListaTarefas } from "./lista"
import { TarefaDialog } from "./tarefa-dialog"
import {
    VISAO_LABEL, VISOES, type MapaMetricas, type TarefaDaLista, type Visao,
} from "./tipos"

const TODOS = "__todos__"
const TODAS_AREAS = "__todas__"

const COLUNAS = `
    *,
    campanha:somos_preta_campanhas(id, nome, cliente:somos_preta_clientes(id, nome)),
    area:somos_preta_areas(id, nome, cor)
`

const PRIORIDADES: TarefaPrioridade[] = ["urgente", "alta", "media", "baixa"]

const PRAZOS = [
    { value: TODOS, label: "Prazo: todos" },
    { value: "hoje", label: "Vence hoje" },
    { value: "semana", label: "Próximos 7 dias" },
    { value: "atrasadas", label: "Atrasadas" },
    { value: "sem", label: "Sem prazo" },
]

export default function TarefasPage() {
    const [supabase] = useState(() => createClient())
    const { profiles } = useProfiles()

    const [tarefas, setTarefas] = useState<TarefaDaLista[]>([])
    const [campanhas, setCampanhas] = useState<{ id: string; nome: string; cliente_id: string | null }[]>([])
    const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([])
    const [areas, setAreas] = useState<Area[]>([])
    const [metricas, setMetricas] = useState<MapaMetricas>(new Map())
    const [atividades, setAtividades] = useState<ItemAtividade[]>([])
    const [euId, setEuId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [falhaSchema, setFalhaSchema] = useState(false)
    // Relógio congelado no carregamento: lê-lo no render tornaria o componente
    // impuro e os recortes por prazo mudariam a cada re-render.
    const [agora, setAgora] = useState(0)

    const [visao, setVisao] = useState<Visao>("board")
    const [busca, setBusca] = useState("")
    const [area, setArea] = useState(TODAS_AREAS)
    const [cliente, setCliente] = useState(TODOS)
    const [campanha, setCampanha] = useState(TODOS)
    const [responsavel, setResponsavel] = useState(TODOS)
    const [prioridade, setPrioridade] = useState(TODOS)
    const [prazo, setPrazo] = useState(TODOS)
    const [status, setStatus] = useState(TODOS)
    const [soMinhas, setSoMinhas] = useState(false)
    const [mostrarArquivadas, setMostrarArquivadas] = useState(false)
    const [rapidos, setRapidos] = useState<Record<string, boolean>>({})

    const [pagina, setPagina] = useState(1)
    const [porPagina, setPorPagina] = useState(10)
    const [selecionados, setSelecionados] = useState<string[]>([])

    const [editando, setEditando] = useState<TarefaDaLista | null>(null)
    const [statusInicial, setStatusInicial] = useState<TarefaStatus | undefined>()
    const [dialogAberto, setDialogAberto] = useState(false)
    const [aberturas, setAberturas] = useState(0)
    const [excluindo, setExcluindo] = useState<TarefaDaLista | null>(null)

    async function carregar() {
        setLoading(true)
        setAgora(Date.now())

        const { data: { user } } = await supabase.auth.getUser()
        setEuId(user?.id ?? null)

        const [ts, camps, cls, ars, mets, atvs] = await Promise.all([
            supabase.from("somos_preta_tarefas").select(COLUNAS).limit(2000),
            supabase.from("somos_preta_campanhas").select("id, nome, cliente_id").order("nome"),
            supabase.from("somos_preta_clientes").select("id, nome").order("nome"),
            supabase.from("somos_preta_areas").select("*").order("ordem"),
            supabase.rpc("somos_preta_tarefa_metricas"),
            supabase.from("somos_preta_atividades")
                .select("*, autor:somos_preta_profiles!autor_id(nome, email, avatar_url)")
                .order("created_at", { ascending: false })
                .limit(8),
        ])

        if (ts.error) { setFalhaSchema(true); setLoading(false); return }

        setFalhaSchema(false)
        setTarefas((ts.data ?? []) as unknown as TarefaDaLista[])
        // Só substitui o que veio bem: com erro o Supabase devolve data null, e
        // o `?? []` transformaria "não consegui ler" em "não existe nada".
        if (!camps.error) setCampanhas((camps.data ?? []) as { id: string; nome: string; cliente_id: string | null }[])
        if (!cls.error) setClientes((cls.data ?? []) as { id: string; nome: string }[])
        if (!ars.error) setAreas((ars.data ?? []) as Area[])
        if (!mets.error) {
            setMetricas(new Map(((mets.data ?? []) as TarefaMetrica[]).map((m) => [m.tarefa_id, m])))
        }
        if (!atvs.error) setAtividades((atvs.data ?? []) as unknown as ItemAtividade[])

        setSelecionados([])
        setLoading(false)
    }

    useEffect(() => {
        carregar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function filtrar<T>(set: (v: T) => void) {
        return (v: T) => { set(v); setPagina(1); setSelecionados([]) }
    }

    const profilesById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles])
    const hoje = useMemo(() => new Date(agora || 0).toISOString().slice(0, 10), [agora])
    const emSeteDias = useMemo(() => {
        const d = new Date(agora || 0)
        d.setDate(d.getDate() + 7)
        return d.toISOString().slice(0, 10)
    }, [agora])

    // ------------------------------------------------------------- filtragem

    const visiveis = useMemo(() => {
        let r = tarefas.filter((t) => mostrarArquivadas || !t.arquivada)

        // A aba "Minhas tarefas" é um recorte, não uma quinta visão: é a Lista
        // já filtrada por quem está olhando.
        if (visao === "minhas" || soMinhas) r = r.filter((t) => t.responsavel === euId)

        const q = busca.trim().toLowerCase()
        if (q) {
            r = r.filter((t) =>
                t.titulo.toLowerCase().includes(q)
                || t.descricao?.toLowerCase().includes(q)
                || t.campanha?.nome.toLowerCase().includes(q)
                || t.tags.some((tag) => tag.toLowerCase().includes(q))
            )
        }

        if (area !== TODAS_AREAS) r = r.filter((t) => t.area_id === area)
        if (cliente !== TODOS) r = r.filter((t) => t.campanha?.cliente?.id === cliente)
        if (campanha !== TODOS) r = r.filter((t) => t.campanha_id === campanha)
        if (responsavel !== TODOS) r = r.filter((t) => t.responsavel === responsavel)
        if (prioridade !== TODOS) r = r.filter((t) => t.prioridade === prioridade)
        if (status !== TODOS) r = r.filter((t) => t.status === status)

        if (prazo === "hoje") r = r.filter((t) => t.data_entrega === hoje)
        else if (prazo === "semana") r = r.filter((t) => t.data_entrega && t.data_entrega >= hoje && t.data_entrega <= emSeteDias)
        else if (prazo === "atrasadas") r = r.filter((t) => t.data_entrega && t.data_entrega < hoje && TAREFA_STATUS_ABERTOS.includes(t.status))
        else if (prazo === "sem") r = r.filter((t) => !t.data_entrega)

        // Os filtros rápidos do calendário são aditivos entre si: marcar dois
        // mostra a união, não a interseção — o contrário devolveria vazio quase
        // sempre ("minhas" E "atrasadas" E "concluídas").
        const ativos = Object.entries(rapidos).filter(([, v]) => v).map(([k]) => k)
        if (ativos.length > 0) {
            r = r.filter((t) => ativos.some((k) => {
                switch (k) {
                    case "minhas": return t.responsavel === euId
                    case "atrasadas": return !!t.data_entrega && t.data_entrega < hoje && TAREFA_STATUS_ABERTOS.includes(t.status)
                    case "semana": return !!t.data_entrega && t.data_entrega >= hoje && t.data_entrega <= emSeteDias
                    case "terceiros": return t.status === "aguardando_terceiro"
                    case "concluidas": return t.status === "concluida"
                    default: return false
                }
            }))
        }

        return r
    }, [
        tarefas, visao, soMinhas, euId, busca, area, cliente, campanha, responsavel,
        prioridade, status, prazo, hoje, emSeteDias, mostrarArquivadas, rapidos,
    ])

    const emLista = useMemo(
        () => visiveis.slice().sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
        [visiveis]
    )

    const totalPaginas = Math.max(1, Math.ceil(emLista.length / porPagina))
    const paginaAtual = Math.min(pagina, totalPaginas)
    const daPagina = emLista.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina)

    const filtrosAtivos = busca.trim() !== "" || area !== TODAS_AREAS || cliente !== TODOS
        || campanha !== TODOS || responsavel !== TODOS || prioridade !== TODOS
        || prazo !== TODOS || status !== TODOS || soMinhas || mostrarArquivadas
        || Object.values(rapidos).some(Boolean)

    // --------------------------------------------------------------- métricas

    const naoArquivadas = tarefas.filter((t) => !t.arquivada)
    const abertas = naoArquivadas.filter((t) => TAREFA_STATUS_ABERTOS.includes(t.status))
    const emAndamento = naoArquivadas.filter((t) => t.status === "em_andamento").length
    const atrasadas = abertas.filter((t) => t.data_entrega && t.data_entrega < hoje).length
    const naSemana = abertas.filter((t) => t.data_entrega && t.data_entrega >= hoje && t.data_entrega <= emSeteDias).length
    const terceiros = naoArquivadas.filter((t) => t.status === "aguardando_terceiro").length
    // Reabrir uma tarefa zera concluida_em, então esta métrica conta o que
    // PERMANECE concluído — não o que foi concluído e depois reaberto.
    const concluidas7 = agora === 0 ? 0 : naoArquivadas.filter((t) =>
        t.concluida_em && new Date(t.concluida_em).getTime() >= agora - 7 * 24 * 60 * 60 * 1000
    ).length

    const proximasDoPrazo = useMemo(
        () => abertas
            .filter((t) => t.data_entrega)
            .slice()
            .sort((a, b) => a.data_entrega!.localeCompare(b.data_entrega!))
            .slice(0, 5),
        [abertas]
    )

    // ----------------------------------------------------------------- ações

    async function mudarStatus(t: TarefaDaLista, novo: TarefaStatus) {
        if (novo === t.status) return
        if (novo === "concluida" && t.evidencia_obrigatoria) {
            toast.error("Esta tarefa exige evidência — conclua pela página dela")
            return
        }
        // Otimista: o board precisa responder no instante em que o card é solto.
        setTarefas((ts) => ts.map((x) => (x.id === t.id ? { ...x, status: novo } : x)))

        const { data, error } = await supabase
            .from("somos_preta_tarefas")
            .update({ status: novo, concluida_em: novo === "concluida" ? new Date().toISOString() : null })
            .eq("id", t.id)
            .select("id")

        if (error || !data?.length) { toast.error("Não foi possível mudar o status"); carregar(); return }
        toast.success(`Movida para ${TAREFA_STATUS[novo].label}`)
    }

    async function arquivar(t: TarefaDaLista) {
        const { data, error } = await supabase
            .from("somos_preta_tarefas")
            .update({ arquivada: !t.arquivada })
            .eq("id", t.id)
            .select("id")
        if (error || !data?.length) { toast.error("Não foi possível arquivar"); return }
        toast.success(t.arquivada ? "Tarefa desarquivada" : "Tarefa arquivada")
        carregar()
    }

    async function duplicar(t: TarefaDaLista) {
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from("somos_preta_tarefas").insert({
            campanha_id: t.campanha_id,
            titulo: `${t.titulo} (cópia)`,
            descricao: t.descricao,
            prioridade: t.prioridade,
            area_id: t.area_id,
            responsavel: t.responsavel,
            data_entrega: t.data_entrega,
            horario: t.horario,
            duracao_minutos: t.duracao_minutos,
            tags: t.tags,
            // A cópia nasce no backlog: duplicar não é reabrir trabalho em curso.
            status: "backlog" as TarefaStatus,
            created_by: user?.id ?? null,
        })
        if (error) { toast.error("Não foi possível duplicar"); return }
        toast.success("Cópia criada no backlog")
        carregar()
    }

    async function excluirTarefa(t: TarefaDaLista) {
        const { error } = await supabase.from("somos_preta_tarefas").delete().eq("id", t.id)
        setExcluindo(null)
        if (error) { toast.error("Não foi possível excluir"); return }
        toast.success("Tarefa excluída")
        carregar()
    }

    function abrirDialogo(t: TarefaDaLista | null, status?: TarefaStatus) {
        setEditando(t)
        setStatusInicial(status)
        setAberturas((n) => n + 1)
        setDialogAberto(true)
    }

    function limparFiltros() {
        setBusca(""); setArea(TODAS_AREAS); setCliente(TODOS); setCampanha(TODOS)
        setResponsavel(TODOS); setPrioridade(TODOS); setPrazo(TODOS); setStatus(TODOS)
        setSoMinhas(false); setMostrarArquivadas(false); setRapidos({})
        setPagina(1); setSelecionados([])
    }

    // ---------------------------------------------------------------- render

    const campanhasFiltradas = cliente === TODOS
        ? campanhas
        : campanhas.filter((c) => c.cliente_id === cliente)

    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <ClipboardList className="h-6 w-6 text-primary" /> Tarefas
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Organize e acompanhe todas as demandas da PRETA. Em um só lugar.
                    </p>
                </div>
                <Button className="rounded-xl" onClick={() => abrirDialogo(null)}>
                    <Plus className="h-4 w-4" /> Nova tarefa
                </Button>
            </div>

            <div className="flex flex-wrap gap-1 border-b">
                {VISOES.map((v) => (
                    <button
                        key={v}
                        type="button"
                        onClick={() => { setVisao(v); setPagina(1) }}
                        aria-current={visao === v ? "true" : undefined}
                        className={cn(
                            "flex h-auto min-h-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors",
                            visao === v
                                ? "border-primary font-medium text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground",
                        )}
                    >
                        {v === "minhas" && <UserRound className="h-4 w-4" />}
                        {v === "board" && <ClipboardList className="h-4 w-4" />}
                        {v === "lista" && <Inbox className="h-4 w-4" />}
                        {v === "calendario" && <CalendarDays className="h-4 w-4" />}
                        {VISAO_LABEL[v]}
                    </button>
                ))}
            </div>

            {falhaSchema ? (
                <Card className="border-status-atencao/40 bg-status-atencao/5">
                    <CardContent className="flex items-start gap-3 p-5">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-status-atencao" />
                        <div className="text-sm">
                            <p className="font-medium">A tela precisa das migrations do painel.</p>
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
                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                        <MetricaCard icone={<Inbox className="h-5 w-5" />} cor="bg-status-info/12 text-status-info"
                            valor={abertas.length} rotulo="Tarefas abertas" />
                        <MetricaCard icone={<Clock className="h-5 w-5" />} cor="bg-status-progresso/12 text-status-progresso"
                            valor={emAndamento} rotulo="Em andamento"
                            onClick={() => filtrar(setStatus)("em_andamento")} />
                        <MetricaCard icone={<TriangleAlert className="h-5 w-5" />} cor="bg-status-erro/12 text-status-erro"
                            valor={atrasadas} rotulo="Atrasadas"
                            destaque={atrasadas > 0 ? "erro" : undefined}
                            onClick={() => filtrar(setPrazo)("atrasadas")} />
                        <MetricaCard icone={<CalendarDays className="h-5 w-5" />} cor="bg-primary/12 text-primary"
                            valor={naSemana} rotulo="Vencem esta semana"
                            onClick={() => filtrar(setPrazo)("semana")} />
                        <MetricaCard icone={<Timer className="h-5 w-5" />} cor="bg-status-atencao/12 text-status-atencao"
                            valor={terceiros} rotulo="Aguardando terceiros"
                            onClick={() => filtrar(setStatus)("aguardando_terceiro")} />
                        <MetricaCard icone={<CheckCircle2 className="h-5 w-5" />} cor="bg-status-sucesso/12 text-status-sucesso"
                            valor={concluidas7} rotulo="Concluídas (7 dias)" />
                    </div>

                    <BarraFiltros
                        busca={busca}
                        onBusca={filtrar(setBusca)}
                        placeholder="Buscar tarefas..."
                        ativos={filtrosAtivos}
                        onLimpar={limparFiltros}
                        filtros={[
                            {
                                chave: "area", label: "Filtrar por área", valor: area, onChange: filtrar(setArea),
                                className: "lg:w-[140px]",
                                opcoes: [{ value: TODAS_AREAS, label: "Área: todas" },
                                    ...areas.map((a) => ({ value: a.id, label: a.nome }))],
                            },
                            {
                                chave: "cliente", label: "Filtrar por cliente", valor: cliente,
                                onChange: (v) => { filtrar(setCliente)(v); setCampanha(TODOS) },
                                opcoes: [{ value: TODOS, label: "Cliente: todos" },
                                    ...clientes.map((c) => ({ value: c.id, label: c.nome }))],
                            },
                            {
                                chave: "campanha", label: "Filtrar por campanha", valor: campanha, onChange: filtrar(setCampanha),
                                opcoes: [{ value: TODOS, label: "Campanha: todas" },
                                    ...campanhasFiltradas.map((c) => ({ value: c.id, label: c.nome }))],
                            },
                            {
                                chave: "responsavel", label: "Filtrar por responsável", valor: responsavel, onChange: filtrar(setResponsavel),
                                opcoes: [{ value: TODOS, label: "Responsável: todos" },
                                    ...profiles.map((p) => ({ value: p.id, label: p.nome ?? p.email ?? p.id }))],
                            },
                            {
                                chave: "prioridade", label: "Filtrar por prioridade", valor: prioridade, onChange: filtrar(setPrioridade),
                                className: "lg:w-[140px]",
                                opcoes: [{ value: TODOS, label: "Prioridade: toda" },
                                    ...PRIORIDADES.map((p) => ({ value: p, label: TAREFA_PRIORIDADE[p].label }))],
                            },
                            {
                                chave: "prazo", label: "Filtrar por prazo", valor: prazo, onChange: filtrar(setPrazo),
                                className: "lg:w-[150px]", opcoes: PRAZOS,
                            },
                            {
                                chave: "status", label: "Filtrar por status", valor: status, onChange: filtrar(setStatus),
                                opcoes: [{ value: TODOS, label: "Status: todos" },
                                    ...TAREFA_STATUS_ORDEM.map((s) => ({ value: s, label: TAREFA_STATUS[s].label }))],
                            },
                        ]}
                        extras={
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    size="sm"
                                    variant={soMinhas ? "default" : "outline"}
                                    className="rounded-xl"
                                    onClick={() => filtrar(setSoMinhas)(!soMinhas)}
                                    aria-pressed={soMinhas}
                                    disabled={visao === "minhas"}
                                    title={visao === "minhas" ? "A aba já mostra só as suas" : undefined}
                                >
                                    <UserRound className="h-3.5 w-3.5" /> Minhas tarefas
                                </Button>
                                <Button
                                    size="sm"
                                    variant={mostrarArquivadas ? "default" : "outline"}
                                    className="rounded-xl"
                                    onClick={() => filtrar(setMostrarArquivadas)(!mostrarArquivadas)}
                                    aria-pressed={mostrarArquivadas}
                                >
                                    Arquivadas
                                </Button>
                            </div>
                        }
                    />

                    {loading ? (
                        <Card><CardContent className="flex items-center justify-center py-16 text-muted-foreground">
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando...
                        </CardContent></Card>
                    ) : visao === "calendario" ? (
                        <Calendario
                            tarefas={visiveis}
                            areas={areas}
                            agora={agora}
                            filtros={rapidos}
                            onFiltro={(k, v) => { setRapidos((r) => ({ ...r, [k]: v })); setPagina(1) }}
                            areaFiltro={area}
                            onAreaFiltro={filtrar(setArea)}
                        />
                    ) : visiveis.length === 0 ? (
                        <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground/40" />
                            <p className="font-medium">
                                {tarefas.length === 0 ? "Nenhuma tarefa ainda" : "Nenhuma tarefa com esses filtros"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {tarefas.length === 0 ? (
                                    campanhas.length === 0
                                        ? <>Crie uma <Link href="/campanhas" className="text-primary underline">campanha</Link> antes — toda tarefa pertence a uma.</>
                                        : "Crie a primeira em “Nova tarefa”."
                                ) : "Ajuste a busca, a área, o responsável ou o prazo."}
                            </p>
                        </CardContent></Card>
                    ) : visao === "board" ? (
                        <>
                            <Board
                                tarefas={visiveis}
                                metricas={metricas}
                                profilesById={profilesById}
                                onMoverStatus={mudarStatus}
                                onNova={(s) => abrirDialogo(null, s)}
                            />

                            <div className="grid gap-4 xl:grid-cols-2">
                                <Card>
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold">Tarefas próximas do prazo</p>
                                            <button
                                                type="button"
                                                className="h-auto min-h-0 text-xs font-medium text-primary hover:underline"
                                                onClick={() => { setVisao("lista"); filtrar(setPrazo)("semana") }}
                                            >
                                                Ver todas
                                            </button>
                                        </div>
                                        {proximasDoPrazo.length === 0 ? (
                                            <p className="py-8 text-center text-sm text-muted-foreground">Nada com prazo à vista.</p>
                                        ) : (
                                            <ul className="mt-3 space-y-1">
                                                {proximasDoPrazo.map((t) => {
                                                    const p = tarefaPrazoBadge(t)
                                                    const r = t.responsavel ? profilesById.get(t.responsavel) : null
                                                    return (
                                                        <li key={t.id}>
                                                            <Link href={`/tarefas/${t.id}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50">
                                                                <span className={cn(
                                                                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                                                                    p ? p.className : "bg-muted text-muted-foreground",
                                                                )}>
                                                                    <Clock className="h-3.5 w-3.5" />
                                                                </span>
                                                                <span className="min-w-0 flex-1 truncate text-sm">{t.titulo}</span>
                                                                {t.campanha && (
                                                                    <Badge variant="outline" className="hidden text-[10px] sm:inline-flex">
                                                                        {t.campanha.nome}
                                                                    </Badge>
                                                                )}
                                                                <span className={cn("shrink-0 text-xs", p ? "text-status-erro" : "text-muted-foreground")}>
                                                                    {p?.label ?? dataCurta(t.data_entrega!)}
                                                                </span>
                                                                {r && <UserAvatar profile={r} />}
                                                            </Link>
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-5">
                                        <p className="text-sm font-semibold">Atividade recente</p>
                                        <div className="mt-3">
                                            <FeedAtividade itens={atividades} vazio="Nenhuma movimentação registrada ainda." />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    ) : (
                        <>
                            <Card><CardContent className="p-0">
                                <ListaTarefas
                                    tarefas={daPagina}
                                    metricas={metricas}
                                    profilesById={profilesById}
                                    selecionados={selecionados}
                                    onAlternar={(id) => setSelecionados((s) =>
                                        s.includes(id) ? s.filter((x) => x !== id) : [...s, id])}
                                    onAlternarTodos={() => {
                                        const ids = daPagina.map((t) => t.id)
                                        const todos = ids.every((id) => selecionados.includes(id))
                                        setSelecionados((s) => todos
                                            ? s.filter((id) => !ids.includes(id))
                                            : [...new Set([...s, ...ids])])
                                    }}
                                    onEditar={(t) => abrirDialogo(t)}
                                    onStatus={mudarStatus}
                                    onDuplicar={duplicar}
                                    onArquivar={arquivar}
                                    onExcluir={setExcluindo}
                                />
                            </CardContent></Card>

                            <Paginacao
                                total={emLista.length}
                                pagina={paginaAtual}
                                porPagina={porPagina}
                                onPagina={setPagina}
                                onPorPagina={(n) => { setPorPagina(n); setPagina(1) }}
                                substantivo={["tarefa", "tarefas"]}
                            />
                        </>
                    )}
                </>
            )}

            <TarefaDialog
                key={`${editando?.id ?? "nova"}-${aberturas}`}
                tarefa={editando}
                statusInicial={statusInicial}
                aberto={dialogAberto}
                onOpenChange={(v) => { setDialogAberto(v); if (!v) { setEditando(null); setStatusInicial(undefined) } }}
                campanhas={campanhas}
                areas={areas}
                onSalvo={() => { setDialogAberto(false); setEditando(null); setStatusInicial(undefined); carregar() }}
            />

            <AlertDialog open={!!excluindo} onOpenChange={(v) => !v && setExcluindo(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            &quot;{excluindo?.titulo}&quot; será removida com subtarefas, comentários, anexos e
                            histórico. Para tirá-la da frente sem perder o registro, use Arquivar.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => excluindo && excluirTarefa(excluindo)}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            Excluir mesmo assim
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
