"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertTriangle, Building2, CheckSquare, Loader2, Megaphone, Plus, Users } from "lucide-react"
import { toast } from "sonner"

import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BarraFiltros } from "@/components/painel/barra-filtros"
import { MetricaCard } from "@/components/painel/metrica-card"
import { Paginacao } from "@/components/painel/paginacao"
import { CLIENTE_STATUS, CLIENTE_STATUS_ORDEM } from "@/lib/constants/campanhas"
import { CAMPANHA_STATUS_ATIVOS } from "@/lib/constants/campanhas"
import { SEGMENTOS } from "@/lib/constants/segmentos"
import { UFS } from "@/lib/constants/uf"
import { useProfiles } from "@/hooks/use-profiles"
import { createClient } from "@/lib/supabase/client"
import type { ClienteStatus, TarefaStatus } from "@/lib/db/types"
import { ClienteDialog } from "./cliente-dialog"
import { PainelCliente } from "./painel-cliente"
import { TabelaClientes } from "./tabela-clientes"
import type {
    CampanhaResumo, ClienteDaLista, ColunaOrdenavel, Ordenacao, TarefaResumo, UltimaAtividade,
} from "./tipos"

const TODOS = "__todos__"

/**
 * Colunas da listagem. O join traz o responsável com cargo — é o que a coluna
 * "Responsável" mostra embaixo do nome, e `role` (permissão) não serve para isso.
 */
const COLUNAS = `
    *, responsavel:somos_preta_profiles!responsavel_id(id, nome, email, avatar_url, cargo)
`

/**
 * A rota antiga /clientes/<id> redireciona para cá com ?aberto=<id>. Ler o
 * parâmetro obriga a um limite de Suspense, porque useSearchParams suspende
 * durante a renderização estática.
 */
export default function ClientesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando...
            </div>
        }>
            <Clientes />
        </Suspense>
    )
}

function Clientes() {
    const [supabase] = useState(() => createClient())
    const { profiles } = useProfiles()

    const [clientes, setClientes] = useState<ClienteDaLista[]>([])
    const [campanhas, setCampanhas] = useState<CampanhaResumo[]>([])
    const [tarefas, setTarefas] = useState<TarefaResumo[]>([])
    const [atividades, setAtividades] = useState<Map<string, UltimaAtividade>>(new Map())
    const [favoritos, setFavoritos] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [falhaSchema, setFalhaSchema] = useState(false)

    const [busca, setBusca] = useState("")
    const [status, setStatus] = useState<string>(TODOS)
    const [segmento, setSegmento] = useState<string>(TODOS)
    const [estado, setEstado] = useState<string>(TODOS)
    const [responsavel, setResponsavel] = useState<string>(TODOS)
    const [ordenacao, setOrdenacao] = useState<Ordenacao>({ coluna: "nome", direcao: "asc" })
    const [pagina, setPagina] = useState(1)
    const [porPagina, setPorPagina] = useState(10)

    // Abre já na conta que o link pedia; depois disso a seleção é do usuário.
    const paramAberto = useSearchParams().get("aberto")
    const [selecionado, setSelecionado] = useState<string | null>(paramAberto)
    const [editando, setEditando] = useState<ClienteDaLista | null>(null)
    const [dialogAberto, setDialogAberto] = useState(false)
    // Conta as aberturas para compor a `key` do diálogo: remontar é o que faz o
    // formulário nascer do cliente certo sem sincronizar props em efeito.
    const [aberturas, setAberturas] = useState(0)
    const [excluindo, setExcluindo] = useState<ClienteDaLista | null>(null)

    async function carregar() {
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()

        const [lista, camps, tars, atvs, favs] = await Promise.all([
            supabase.from("somos_preta_clientes").select(COLUNAS).limit(500),
            supabase.from("somos_preta_campanhas")
                .select("id, nome, cliente_id, status, capa_url, data_inicio, data_fim").limit(1000),
            supabase.from("somos_preta_tarefas")
                .select("id, titulo, campanha_id, status, data_entrega, horario")
                .eq("arquivada", false).limit(2000),
            supabase.from("somos_preta_atividades")
                .select("entidade_id, resumo, created_at")
                .eq("entidade", "cliente")
                .order("created_at", { ascending: false })
                .limit(500),
            user
                ? supabase.from("somos_preta_cliente_favoritos").select("cliente_id").eq("profile_id", user.id)
                : Promise.resolve({ data: [], error: null }),
        ])

        if (lista.error) { setFalhaSchema(true); setLoading(false); return }

        setFalhaSchema(false)
        setClientes((lista.data ?? []) as unknown as ClienteDaLista[])
        // Só substitui o que veio bem: com erro o Supabase devolve data null, e
        // o `?? []` transformaria "não consegui ler" em "não existe nada".
        if (!camps.error) setCampanhas((camps.data ?? []) as CampanhaResumo[])
        if (!tars.error) setTarefas((tars.data ?? []) as TarefaResumo[])

        if (!atvs.error) {
            // A consulta já vem da mais recente para a mais antiga, então a
            // PRIMEIRA linha de cada cliente é a última atividade dele.
            const mapa = new Map<string, UltimaAtividade>()
            for (const a of (atvs.data ?? []) as { entidade_id: string | null; resumo: string; created_at: string }[]) {
                if (a.entidade_id && !mapa.has(a.entidade_id)) {
                    mapa.set(a.entidade_id, { resumo: a.resumo, created_at: a.created_at })
                }
            }
            setAtividades(mapa)
        }

        if (!favs.error) {
            setFavoritos(new Set(((favs.data ?? []) as { cliente_id: string }[]).map((f) => f.cliente_id)))
        }

        setLoading(false)
    }

    useEffect(() => {
        carregar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /** Todo filtro volta para a primeira página e limpa a seleção aberta. */
    function filtrar<T>(set: (v: T) => void) {
        return (v: T) => { set(v); setPagina(1) }
    }

    // ------------------------------------------------------------- derivados

    const campanhasPorCliente = useMemo(() => {
        const mapa = new Map<string, { total: number; ativas: number }>()
        for (const c of campanhas) {
            if (!c.cliente_id) continue
            const atual = mapa.get(c.cliente_id) ?? { total: 0, ativas: 0 }
            atual.total += 1
            if (CAMPANHA_STATUS_ATIVOS.includes(c.status)) atual.ativas += 1
            mapa.set(c.cliente_id, atual)
        }
        return mapa
    }, [campanhas])

    /** Tarefa não aponta para cliente: a ligação passa pela campanha. */
    const tarefasPorCliente = useMemo(() => {
        const clientePorCampanha = new Map(campanhas.map((c) => [c.id, c.cliente_id]))
        const mapa = new Map<string, TarefaResumo[]>()
        for (const t of tarefas) {
            const cliente = clientePorCampanha.get(t.campanha_id)
            if (!cliente) continue
            const atual = mapa.get(cliente) ?? []
            atual.push(t)
            mapa.set(cliente, atual)
        }
        return mapa
    }, [tarefas, campanhas])

    const filtrados = useMemo(() => {
        let r = clientes
        const q = busca.trim().toLowerCase()
        if (q) {
            r = r.filter((c) =>
                c.nome.toLowerCase().includes(q)
                || c.empresa?.toLowerCase().includes(q)
                || c.segmento?.toLowerCase().includes(q)
                || c.cidade?.toLowerCase().includes(q)
                || c.responsavel?.nome?.toLowerCase().includes(q)
            )
        }
        if (status !== TODOS) r = r.filter((c) => c.status === status)
        if (segmento !== TODOS) r = r.filter((c) => c.segmento === segmento)
        if (estado !== TODOS) r = r.filter((c) => c.estado === estado)
        if (responsavel !== TODOS) r = r.filter((c) => c.responsavel_id === responsavel)
        return r
    }, [clientes, busca, status, segmento, estado, responsavel])

    const ordenados = useMemo(() => {
        const dir = ordenacao.direcao === "asc" ? 1 : -1
        const chave = (c: ClienteDaLista): string | number => {
            switch (ordenacao.coluna) {
                case "segmento": return c.segmento ?? ""
                case "local": return [c.cidade, c.estado].filter(Boolean).join(" ")
                case "campanhas": return campanhasPorCliente.get(c.id)?.total ?? 0
                case "responsavel": return c.responsavel?.nome ?? c.responsavel?.email ?? ""
                // Data como número: comparar ISO por localeCompare erra quando um
                // lado tem fração de segundo e o outro não.
                case "atividade": return atividades.get(c.id) ? new Date(atividades.get(c.id)!.created_at).getTime() : 0
                case "status": return CLIENTE_STATUS_ORDEM.indexOf(c.status)
                default: return c.nome
            }
        }
        return filtrados.slice().sort((a, b) => {
            const va = chave(a), vb = chave(b)
            if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir
            return String(va).localeCompare(String(vb), "pt-BR") * dir
        })
    }, [filtrados, ordenacao, campanhasPorCliente, atividades])

    const totalPaginas = Math.max(1, Math.ceil(ordenados.length / porPagina))
    const paginaAtual = Math.min(pagina, totalPaginas)
    const daPagina = ordenados.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina)

    const clienteAberto = clientes.find((c) => c.id === selecionado) ?? null

    const filtrosAtivos = busca.trim() !== "" || status !== TODOS
        || segmento !== TODOS || estado !== TODOS || responsavel !== TODOS

    // --------------------------------------------------------------- métricas

    const ativos = clientes.filter((c) => c.status === "ativo").length
    const campanhasAtivas = campanhas.filter((c) => CAMPANHA_STATUS_ATIVOS.includes(c.status)).length
    const tarefasVinculadas = [...tarefasPorCliente.values()].reduce((n, t) => n + t.length, 0)
    const responsaveisAtivos = new Set(
        clientes.filter((c) => c.status === "ativo" && c.responsavel_id).map((c) => c.responsavel_id)
    ).size

    // ----------------------------------------------------------------- ações

    function ordenar(coluna: ColunaOrdenavel) {
        setOrdenacao((o) =>
            o.coluna === coluna
                ? { coluna, direcao: o.direcao === "asc" ? "desc" : "asc" }
                : { coluna, direcao: "asc" }
        )
    }

    async function mudarStatus(c: ClienteDaLista, novo: ClienteStatus) {
        const { data, error } = await supabase
            .from("somos_preta_clientes")
            .update({ status: novo })
            .eq("id", c.id)
            .select("id")
        if (error || !data?.length) { toast.error("Não foi possível mudar o status"); return }
        toast.success(`${c.nome} agora está ${CLIENTE_STATUS[novo].label.toLowerCase()}`)
        carregar()
    }

    async function alternarFavorito(c: ClienteDaLista) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        if (favoritos.has(c.id)) {
            const { error } = await supabase.from("somos_preta_cliente_favoritos")
                .delete().eq("cliente_id", c.id).eq("profile_id", user.id)
            if (error) { toast.error("Não foi possível remover"); return }
            setFavoritos((f) => new Set([...f].filter((x) => x !== c.id)))
        } else {
            const { error } = await supabase.from("somos_preta_cliente_favoritos")
                .insert({ cliente_id: c.id, profile_id: user.id })
            if (error) { toast.error("Não foi possível favoritar"); return }
            setFavoritos((f) => new Set([...f, c.id]))
        }
    }

    async function excluirCliente(c: ClienteDaLista) {
        const { error } = await supabase.from("somos_preta_clientes").delete().eq("id", c.id)
        setExcluindo(null)
        if (error) { toast.error("Não foi possível excluir"); return }
        if (selecionado === c.id) setSelecionado(null)
        toast.success("Cliente excluído")
        carregar()
    }

    async function mudarStatusTarefa(id: string, novo: TarefaStatus) {
        const { data, error } = await supabase
            .from("somos_preta_tarefas")
            .update({
                status: novo,
                concluida_em: novo === "concluida" ? new Date().toISOString() : null,
            })
            .eq("id", id)
            .select("id")
        if (error || !data?.length) { toast.error("Não foi possível atualizar a tarefa"); return }
        setTarefas((ts) => ts.map((t) => (t.id === id ? { ...t, status: novo } : t)))
    }

    // ---------------------------------------------------------------- render

    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <Building2 className="h-6 w-6 text-primary" /> Clientes
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Gerencie as contas, marcas e campanhas dos seus clientes.
                    </p>
                </div>
                <Button
                    className="rounded-xl"
                    onClick={() => { setEditando(null); setAberturas((n) => n + 1); setDialogAberto(true) }}
                >
                    <Plus className="h-4 w-4" /> Novo cliente
                </Button>
            </div>

            {falhaSchema ? (
                <Card className="border-status-atencao/40 bg-status-atencao/5">
                    <CardContent className="flex items-start gap-3 p-5">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-status-atencao" />
                        <div className="text-sm">
                            <p className="font-medium">A tela precisa das migrations do painel.</p>
                            <p className="mt-1 text-muted-foreground">
                                Aplique <code className="rounded bg-muted px-1 py-0.5 text-xs">0019_painel_enums.sql</code> e
                                depois <code className="rounded bg-muted px-1 py-0.5 text-xs">0020_painel_operacao.sql</code>{" "}
                                no SQL Editor do Supabase, nessa ordem, e recarregue.
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
                            icone={<Building2 className="h-5 w-5" />}
                            cor="bg-status-sucesso/12 text-status-sucesso"
                            valor={ativos}
                            rotulo={ativos === 1 ? "cliente ativo" : "clientes ativos"}
                            onClick={() => filtrar(setStatus)("ativo")}
                        />
                        <MetricaCard
                            icone={<Megaphone className="h-5 w-5" />}
                            cor="bg-primary/12 text-primary"
                            valor={campanhasAtivas}
                            rotulo={campanhasAtivas === 1 ? "campanha ativa" : "campanhas ativas"}
                            href="/campanhas"
                        />
                        <MetricaCard
                            icone={<CheckSquare className="h-5 w-5" />}
                            cor="bg-status-info/12 text-status-info"
                            valor={tarefasVinculadas}
                            rotulo={tarefasVinculadas === 1 ? "tarefa vinculada" : "tarefas vinculadas"}
                            href="/tarefas"
                        />
                        <MetricaCard
                            icone={<Users className="h-5 w-5" />}
                            cor="bg-status-atencao/12 text-status-atencao"
                            valor={responsaveisAtivos}
                            rotulo={responsaveisAtivos === 1 ? "responsável ativo" : "responsáveis ativos"}
                        />
                    </div>

                    <BarraFiltros
                        busca={busca}
                        onBusca={filtrar(setBusca)}
                        placeholder="Buscar cliente, marca ou palavra-chave..."
                        ativos={filtrosAtivos}
                        onLimpar={() => {
                            setBusca(""); setStatus(TODOS); setSegmento(TODOS)
                            setEstado(TODOS); setResponsavel(TODOS); setPagina(1)
                        }}
                        filtros={[
                            {
                                chave: "status", label: "Filtrar por status", valor: status,
                                onChange: filtrar(setStatus),
                                opcoes: [
                                    { value: TODOS, label: "Status: todos" },
                                    ...CLIENTE_STATUS_ORDEM.map((s) => ({ value: s, label: CLIENTE_STATUS[s].label })),
                                ],
                            },
                            {
                                chave: "segmento", label: "Filtrar por segmento", valor: segmento,
                                onChange: filtrar(setSegmento),
                                opcoes: [
                                    { value: TODOS, label: "Segmento: todos" },
                                    ...SEGMENTOS.map((s) => ({ value: s, label: s })),
                                ],
                            },
                            {
                                chave: "estado", label: "Filtrar por estado", valor: estado,
                                onChange: filtrar(setEstado),
                                className: "lg:w-[130px]",
                                opcoes: [
                                    { value: TODOS, label: "Estado: todos" },
                                    ...UFS.map((u) => ({ value: u.sigla, label: u.sigla })),
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
                        ]}
                    />

                    <Card>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex items-center justify-center py-16 text-muted-foreground">
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando...
                                </div>
                            ) : ordenados.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <Building2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
                                    <p className="font-medium">
                                        {clientes.length === 0 ? "Nenhum cliente ainda" : "Nenhum cliente com esses filtros"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {clientes.length === 0
                                            ? "Cadastre a primeira conta em “Novo cliente”."
                                            : "Ajuste a busca, o status, o segmento ou o responsável."}
                                    </p>
                                </div>
                            ) : (
                                <TabelaClientes
                                    clientes={daPagina}
                                    campanhasPorCliente={campanhasPorCliente}
                                    atividadePorCliente={atividades}
                                    favoritos={favoritos}
                                    selecionado={selecionado}
                                    ordenacao={ordenacao}
                                    onOrdenar={ordenar}
                                    onSelecionar={(id) => setSelecionado((s) => (s === id ? null : id))}
                                    onEditar={(c) => { setEditando(c); setAberturas((n) => n + 1); setDialogAberto(true) }}
                                    onExcluir={setExcluindo}
                                    onStatus={mudarStatus}
                                    onFavorito={alternarFavorito}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Paginacao
                        total={ordenados.length}
                        pagina={paginaAtual}
                        porPagina={porPagina}
                        onPagina={setPagina}
                        onPorPagina={(n) => { setPorPagina(n); setPagina(1) }}
                        substantivo={["cliente", "clientes"]}
                    />

                    {clienteAberto && (
                        <PainelCliente
                            cliente={clienteAberto}
                            campanhas={campanhas.filter((c) => c.cliente_id === clienteAberto.id)}
                            tarefas={tarefasPorCliente.get(clienteAberto.id) ?? []}
                            onEditarTarefa={mudarStatusTarefa}
                        />
                    )}
                </>
            )}

            <ClienteDialog
                key={`${editando?.id ?? "novo"}-${aberturas}`}
                cliente={editando}
                aberto={dialogAberto}
                onOpenChange={(v) => { setDialogAberto(v); if (!v) setEditando(null) }}
                profiles={profiles}
                onSalvo={() => { setDialogAberto(false); setEditando(null); carregar() }}
            />

            <AlertDialog open={!!excluindo} onOpenChange={(v) => !v && setExcluindo(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                        <AlertDialogDescription>
                            &quot;{excluindo?.nome}&quot; será removido — e com ele as campanhas, tarefas,
                            subtarefas, comentários e anexos vinculados, em cascata. Para tirar a conta de
                            circulação sem perder o histórico, mude o status para Encerrado.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => excluindo && excluirCliente(excluindo)}
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
