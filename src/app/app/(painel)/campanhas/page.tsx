"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
    AlertTriangle, CalendarClock, CircleAlert, LayoutGrid, List, Loader2,
    Megaphone, Plus, Timer,
} from "lucide-react"
import { toast } from "sonner"

import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { BarraFiltros } from "@/components/painel/barra-filtros"
import { MetricaCard, variacaoPercentual } from "@/components/painel/metrica-card"
import { Paginacao } from "@/components/painel/paginacao"
import { dataCurta } from "@/lib/constants/blog"
import {
    brl, CAMPANHA_ETAPA_LABEL, CAMPANHA_STATUS, CAMPANHA_STATUS_ATIVOS,
    CAMPANHA_STATUS_ORDEM, orcamentoDaCampanha,
} from "@/lib/constants/campanhas"
import { TAREFA_PRIORIDADE } from "@/lib/constants/tarefas"
import { BLOG_PERIODOS, type BlogPeriodo } from "@/lib/constants/blog"
import { useProfiles } from "@/hooks/use-profiles"
import { createClient } from "@/lib/supabase/client"
import type {
    CampanhaEtapa, CampanhaMetrica, CampanhaStatus, Cliente, TarefaPrioridade,
} from "@/lib/db/types"
import { cn } from "@/lib/utils"
import { CampanhaDialog } from "./campanha-dialog"
import { CardCampanha } from "./card-campanha"
import { capaDaCampanha, type CampanhaDaLista, type MapaMetricas } from "./tipos"

const TODOS = "__todos__"

const COLUNAS = `
    *,
    cliente:somos_preta_clientes(id, nome, logo_url),
    dono:somos_preta_profiles!responsavel(id, nome, email, avatar_url)
`

export default function CampanhasPage() {
    const [supabase] = useState(() => createClient())
    const { profiles } = useProfiles()

    const [campanhas, setCampanhas] = useState<CampanhaDaLista[]>([])
    const [clientes, setClientes] = useState<Pick<Cliente, "id" | "nome">[]>([])
    const [metricas, setMetricas] = useState<MapaMetricas>(new Map())
    const [loading, setLoading] = useState(true)
    const [falhaSchema, setFalhaSchema] = useState(false)
    // Relógio congelado no carregamento: ler Date.now() no render tornaria o
    // filtro de período instável entre renderizações.
    const [agora, setAgora] = useState(0)

    const [visao, setVisao] = useState<"cards" | "lista">("cards")
    const [busca, setBusca] = useState("")
    const [status, setStatus] = useState(TODOS)
    const [cliente, setCliente] = useState(TODOS)
    const [responsavel, setResponsavel] = useState(TODOS)
    const [periodo, setPeriodo] = useState<BlogPeriodo>("todos")
    const [prioridade, setPrioridade] = useState(TODOS)
    const [pagina, setPagina] = useState(1)
    const [porPagina, setPorPagina] = useState(10)

    const [editando, setEditando] = useState<CampanhaDaLista | null>(null)
    const [dialogAberto, setDialogAberto] = useState(false)
    const [aberturas, setAberturas] = useState(0)
    const [excluindo, setExcluindo] = useState<CampanhaDaLista | null>(null)

    async function carregar() {
        setLoading(true)
        setAgora(Date.now())

        const [lista, cls, mets] = await Promise.all([
            supabase.from("somos_preta_campanhas").select(COLUNAS).limit(500),
            supabase.from("somos_preta_clientes").select("id, nome").order("nome"),
            supabase.rpc("somos_preta_campanha_metricas"),
        ])

        if (lista.error) { setFalhaSchema(true); setLoading(false); return }

        setFalhaSchema(false)
        setCampanhas((lista.data ?? []) as unknown as CampanhaDaLista[])
        if (!cls.error) setClientes((cls.data ?? []) as Pick<Cliente, "id" | "nome">[])
        if (!mets.error) {
            setMetricas(new Map(((mets.data ?? []) as CampanhaMetrica[]).map((m) => [m.campanha_id, m])))
        }
        setLoading(false)
    }

    useEffect(() => {
        carregar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function filtrar<T>(set: (v: T) => void) {
        return (v: T) => { set(v); setPagina(1) }
    }

    // ------------------------------------------------------------- derivados

    const filtradas = useMemo(() => {
        let r = campanhas
        const q = busca.trim().toLowerCase()
        if (q) {
            r = r.filter((c) =>
                c.nome.toLowerCase().includes(q)
                || c.cliente?.nome.toLowerCase().includes(q)
                || c.tagline?.toLowerCase().includes(q)
            )
        }
        if (status !== TODOS) r = r.filter((c) => c.status === status)
        if (cliente !== TODOS) r = r.filter((c) => c.cliente_id === cliente)
        if (responsavel !== TODOS) r = r.filter((c) => c.responsavel === responsavel)
        if (prioridade !== TODOS) r = r.filter((c) => c.prioridade === prioridade)
        if (periodo !== "todos" && agora > 0) {
            const limite = agora - Number(periodo) * 24 * 60 * 60 * 1000
            r = r.filter((c) => new Date(c.created_at).getTime() >= limite)
        }
        return r.slice().sort((a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
    }, [campanhas, busca, status, cliente, responsavel, prioridade, periodo, agora])

    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina))
    const paginaAtual = Math.min(pagina, totalPaginas)
    const daPagina = filtradas.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina)

    const filtrosAtivos = busca.trim() !== "" || status !== TODOS || cliente !== TODOS
        || responsavel !== TODOS || prioridade !== TODOS || periodo !== "todos"

    // --------------------------------------------------------------- métricas

    const ativas = campanhas.filter((c) => CAMPANHA_STATUS_ATIVOS.includes(c.status))

    const criadasNoMes = agora === 0 ? 0 : campanhas.filter(
        (c) => new Date(c.created_at).getTime() >= agora - 30 * 24 * 60 * 60 * 1000
    ).length
    const criadasNoMesAnterior = agora === 0 ? 0 : campanhas.filter((c) => {
        const t = new Date(c.created_at).getTime()
        return t >= agora - 60 * 24 * 60 * 60 * 1000 && t < agora - 30 * 24 * 60 * 60 * 1000
    }).length

    const aguardando = campanhas.filter((c) => c.status === "em_aprovacao")
    // status_desde (e não updated_at) porque corrigir uma vírgula no briefing
    // não pode zerar o contador de espera.
    const paradas = agora === 0 ? 0 : aguardando.filter(
        (c) => new Date(c.status_desde).getTime() < agora - 7 * 24 * 60 * 60 * 1000
    ).length

    const entregasNaSemana = agora === 0 ? 0 : campanhas.filter((c) => {
        const prox = metricas.get(c.id)?.proxima_entrega
        if (!prox) return false
        const t = new Date(prox).getTime()
        return t >= agora && t <= agora + 7 * 24 * 60 * 60 * 1000
    }).length

    const hoje = new Date(agora || Date.now()).toISOString().slice(0, 10)
    const atrasadas = campanhas.filter(
        (c) => c.data_fim && c.data_fim < hoje && CAMPANHA_STATUS_ATIVOS.includes(c.status)
    ).length

    // ----------------------------------------------------------------- ações

    async function aplicar(c: CampanhaDaLista, patch: Record<string, unknown>, msg: string) {
        const { data, error } = await supabase
            .from("somos_preta_campanhas")
            .update(patch)
            .eq("id", c.id)
            .select("id")
        if (error || !data?.length) { toast.error("Não foi possível atualizar"); return }
        toast.success(msg)
        carregar()
    }

    async function excluirCampanha(c: CampanhaDaLista) {
        const { error } = await supabase.from("somos_preta_campanhas").delete().eq("id", c.id)
        setExcluindo(null)
        if (error) { toast.error("Não foi possível excluir"); return }
        toast.success("Campanha excluída")
        carregar()
    }

    function abrirDialogo(c: CampanhaDaLista | null) {
        setEditando(c)
        setAberturas((n) => n + 1)
        setDialogAberto(true)
    }

    /** Responsável + cliente formam a pilha de avatares do card. */
    function equipeDa(c: CampanhaDaLista) {
        return c.dono ? [c.dono] : []
    }

    // ---------------------------------------------------------------- render

    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <Megaphone className="h-6 w-6 text-primary" /> Campanhas
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Acompanhe campanhas, entregas, responsáveis e resultados.
                    </p>
                </div>
                <Button className="rounded-xl" onClick={() => abrirDialogo(null)}>
                    <Plus className="h-4 w-4" /> Nova campanha
                </Button>
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
                            <Button variant="outline" size="sm" className="mt-3 rounded-xl" onClick={carregar}>
                                Tentar de novo
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricaCard
                            icone={<Megaphone className="h-5 w-5" />}
                            cor="bg-status-sucesso/12 text-status-sucesso"
                            valor={ativas.length}
                            rotulo={ativas.length === 1 ? "Campanha ativa" : "Campanhas ativas"}
                            variacao={variacaoPercentual(criadasNoMes, criadasNoMesAnterior, "vs. mês anterior")}
                            detalhe={criadasNoMes > 0 ? `+${criadasNoMes} no último mês` : undefined}
                        />
                        <MetricaCard
                            icone={<Timer className="h-5 w-5" />}
                            cor="bg-status-atencao/12 text-status-atencao"
                            valor={aguardando.length}
                            rotulo="Aguardando aprovação"
                            detalhe={paradas > 0 ? `${paradas} há mais de 7 dias` : undefined}
                            destaque={paradas > 0 ? "atencao" : undefined}
                            onClick={() => filtrar(setStatus)("em_aprovacao")}
                        />
                        <MetricaCard
                            icone={<CalendarClock className="h-5 w-5" />}
                            cor="bg-status-info/12 text-status-info"
                            valor={entregasNaSemana}
                            rotulo="Entregas nesta semana"
                            href="/tarefas"
                            hrefLabel="Ver no calendário →"
                        />
                        <MetricaCard
                            icone={<CircleAlert className="h-5 w-5" />}
                            cor="bg-status-erro/12 text-status-erro"
                            valor={atrasadas}
                            rotulo={atrasadas === 1 ? "Campanha atrasada" : "Campanhas atrasadas"}
                            detalhe={atrasadas > 0 ? "Requer atenção" : undefined}
                            destaque={atrasadas > 0 ? "erro" : undefined}
                        />
                    </div>

                    <BarraFiltros
                        busca={busca}
                        onBusca={filtrar(setBusca)}
                        placeholder="Buscar campanha ou cliente..."
                        ativos={filtrosAtivos}
                        onLimpar={() => {
                            setBusca(""); setStatus(TODOS); setCliente(TODOS)
                            setResponsavel(TODOS); setPeriodo("todos"); setPrioridade(TODOS); setPagina(1)
                        }}
                        filtros={[
                            {
                                chave: "status", label: "Filtrar por status", valor: status,
                                onChange: filtrar(setStatus),
                                opcoes: [
                                    { value: TODOS, label: "Status: todos" },
                                    ...CAMPANHA_STATUS_ORDEM.map((s) => ({ value: s, label: CAMPANHA_STATUS[s].label })),
                                ],
                            },
                            {
                                chave: "cliente", label: "Filtrar por cliente", valor: cliente,
                                onChange: filtrar(setCliente),
                                opcoes: [
                                    { value: TODOS, label: "Cliente: todos" },
                                    ...clientes.map((c) => ({ value: c.id, label: c.nome })),
                                ],
                            },
                            {
                                chave: "responsavel", label: "Filtrar por responsável", valor: responsavel,
                                onChange: filtrar(setResponsavel),
                                opcoes: [
                                    { value: TODOS, label: "Responsável: todos" },
                                    ...profiles.map((p) => ({ value: p.id, label: p.nome ?? p.email ?? p.id })),
                                ],
                            },
                            {
                                chave: "periodo", label: "Filtrar por período", valor: periodo,
                                onChange: filtrar(setPeriodo) as (v: string) => void,
                                opcoes: BLOG_PERIODOS.map((p) => ({ value: p.value, label: p.label })),
                            },
                            {
                                chave: "prioridade", label: "Filtrar por prioridade", valor: prioridade,
                                onChange: filtrar(setPrioridade),
                                className: "lg:w-[150px]",
                                opcoes: [
                                    { value: TODOS, label: "Prioridade: toda" },
                                    ...(["urgente", "alta", "media", "baixa"] as TarefaPrioridade[])
                                        .map((p) => ({ value: p, label: TAREFA_PRIORIDADE[p].label })),
                                ],
                            },
                        ]}
                        extras={
                            <div className="flex items-center gap-1 rounded-xl border p-1">
                                <Button
                                    size="sm"
                                    variant={visao === "cards" ? "default" : "ghost"}
                                    className="rounded-lg"
                                    onClick={() => setVisao("cards")}
                                    aria-pressed={visao === "cards"}
                                >
                                    <LayoutGrid className="h-3.5 w-3.5" /> Cards
                                </Button>
                                <Button
                                    size="sm"
                                    variant={visao === "lista" ? "default" : "ghost"}
                                    className="rounded-lg"
                                    onClick={() => setVisao("lista")}
                                    aria-pressed={visao === "lista"}
                                >
                                    <List className="h-3.5 w-3.5" /> Lista
                                </Button>
                            </div>
                        }
                    />

                    {loading ? (
                        <Card><CardContent className="flex items-center justify-center py-16 text-muted-foreground">
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando...
                        </CardContent></Card>
                    ) : filtradas.length === 0 ? (
                        <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <Megaphone className="mb-3 h-10 w-10 text-muted-foreground/40" />
                            <p className="font-medium">
                                {campanhas.length === 0 ? "Nenhuma campanha ainda" : "Nenhuma campanha com esses filtros"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {campanhas.length === 0 ? (
                                    clientes.length === 0
                                        ? <>Cadastre um <Link href="/clientes" className="text-primary underline">cliente</Link> antes de criar campanhas.</>
                                        : "Crie a primeira em “Nova campanha”."
                                ) : "Ajuste a busca, o status, o cliente ou o período."}
                            </p>
                        </CardContent></Card>
                    ) : visao === "cards" ? (
                        <div className="grid gap-4 xl:grid-cols-2">
                            {daPagina.map((c) => (
                                <CardCampanha
                                    key={c.id}
                                    campanha={c}
                                    metrica={metricas.get(c.id)}
                                    equipe={equipeDa(c)}
                                    onEditar={abrirDialogo}
                                    onExcluir={setExcluindo}
                                    onStatus={(camp, s: CampanhaStatus) =>
                                        aplicar(camp, { status: s }, `Campanha movida para ${CAMPANHA_STATUS[s].label.toLowerCase()}`)}
                                    onEtapa={(camp, e: CampanhaEtapa) =>
                                        aplicar(camp, { etapa: e }, `Etapa: ${CAMPANHA_ETAPA_LABEL[e]}`)}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card><CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Campanha</TableHead>
                                        <TableHead className="hidden md:table-cell">Cliente</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="hidden lg:table-cell">Etapa</TableHead>
                                        <TableHead className="hidden xl:table-cell">Responsável</TableHead>
                                        <TableHead className="hidden sm:table-cell">Prazo</TableHead>
                                        <TableHead className="hidden lg:table-cell text-right">Orçamento</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {daPagina.map((c) => {
                                        const capa = capaDaCampanha(c)
                                        const orc = orcamentoDaCampanha(c)
                                        return (
                                            <TableRow key={c.id}>
                                                <TableCell className="max-w-[260px] font-medium whitespace-normal">
                                                    <Link href={`/campanhas/${c.id}`} className="flex items-center gap-2.5 hover:text-primary">
                                                        {capa ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={capa} alt="" className="h-8 w-8 shrink-0 rounded-lg bg-muted object-cover" />
                                                        ) : (
                                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                                                <Megaphone className="h-3.5 w-3.5" />
                                                            </span>
                                                        )}
                                                        <span className="truncate uppercase">{c.nome}</span>
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-muted-foreground">
                                                    {c.cliente?.nome ?? "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className={CAMPANHA_STATUS[c.status].className}>
                                                        {CAMPANHA_STATUS[c.status].label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell text-muted-foreground">
                                                    {CAMPANHA_ETAPA_LABEL[c.etapa]}
                                                </TableCell>
                                                <TableCell className="hidden xl:table-cell text-muted-foreground">
                                                    {c.dono?.nome ?? c.dono?.email ?? "—"}
                                                </TableCell>
                                                <TableCell className={cn(
                                                    "hidden sm:table-cell",
                                                    c.data_fim && c.data_fim < hoje && "text-status-erro",
                                                )}>
                                                    {c.data_fim ? dataCurta(c.data_fim) : "—"}
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell text-right tabular-nums">
                                                    {orc ? brl(orc.valor) : "—"}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent></Card>
                    )}

                    <Paginacao
                        total={filtradas.length}
                        pagina={paginaAtual}
                        porPagina={porPagina}
                        onPagina={setPagina}
                        onPorPagina={(n) => { setPorPagina(n); setPagina(1) }}
                        substantivo={["campanha", "campanhas"]}
                    />
                </>
            )}

            <CampanhaDialog
                key={`${editando?.id ?? "nova"}-${aberturas}`}
                campanha={editando}
                aberto={dialogAberto}
                onOpenChange={(v) => { setDialogAberto(v); if (!v) setEditando(null) }}
                clientes={clientes}
                profiles={profiles}
                onSalvo={() => { setDialogAberto(false); setEditando(null); carregar() }}
            />

            <AlertDialog open={!!excluindo} onOpenChange={(v) => !v && setExcluindo(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
                        <AlertDialogDescription>
                            &quot;{excluindo?.nome}&quot; será removida — e com ela as tarefas, subtarefas,
                            comentários e anexos vinculados, em cascata. Para tirá-la de circulação
                            preservando o histórico, mude o status para Cancelada.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => excluindo && excluirCampanha(excluindo)}
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
