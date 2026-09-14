"use client"

import { useEffect, useMemo, useState } from "react"
import {
    AlertTriangle, Archive, ChevronLeft, ChevronRight, EyeOff, Filter, Loader2,
    Newspaper, Plus, Search, Send, Settings2, Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownSelect } from "@/components/ui/dropdown-select"
import { Input } from "@/components/ui/input"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    BLOG_PERIODOS, BLOG_STATUS, BLOG_STATUS_ORDEM, type BlogPeriodo,
} from "@/lib/constants/blog"
import { createClient } from "@/lib/supabase/client"
import type { BlogCategoria, BlogMetrica, BlogStatus } from "@/lib/db/types"
import { cn } from "@/lib/utils"
import { revalidarBlog } from "./actions"
import { CategoriasDialog } from "./categorias-dialog"
import { Estatisticas } from "./estatisticas"
import { PostDialog } from "./post-dialog"
import { TabelaPosts } from "./tabela-posts"
import { dataRelevante, type PostDaLista } from "./tipos"

const POR_PAGINA = 10

/**
 * Colunas da listagem — `conteudo` fica de fora de propósito: é o campo mais
 * pesado da tabela e não aparece na tela. O diálogo de edição o busca depois.
 */
const COLUNAS = `
    id, slug, titulo, resumo, cover_url, categoria, tags, status, autor_id,
    destaque, agendado_para, publicado_em, created_at, updated_at,
    autor:somos_preta_profiles!autor_id(nome, email, avatar_url)
`

/** Janela de páginas com reticências, no formato "1 2 3 … 9". */
function paginasVisiveis(atual: number, total: number): (number | "…")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const perto = [1, total, atual, atual - 1, atual + 1]
        .filter((n) => n >= 1 && n <= total)
    const unicas = [...new Set(perto)].sort((a, b) => a - b)
    const saida: (number | "…")[] = []
    unicas.forEach((n, i) => {
        if (i > 0 && n - (unicas[i - 1] as number) > 1) saida.push("…")
        saida.push(n)
    })
    return saida
}

export default function BlogPage() {
    const [supabase] = useState(() => createClient())

    const [posts, setPosts] = useState<PostDaLista[]>([])
    const [categorias, setCategorias] = useState<BlogCategoria[]>([])
    const [metricas, setMetricas] = useState<BlogMetrica[]>([])
    const [loading, setLoading] = useState(true)
    const [falhaSchema, setFalhaSchema] = useState(false)
    // Relógio congelado no carregamento: ler Date.now() durante o render deixaria
    // o filtro de período mudando de resposta a cada re-render.
    const [agora, setAgora] = useState(0)

    const [busca, setBusca] = useState("")
    const [statusFiltro, setStatusFiltro] = useState<BlogStatus | "todos">("todos")
    const [categoriaFiltro, setCategoriaFiltro] = useState("todas")
    const [periodo, setPeriodo] = useState<BlogPeriodo>("todos")
    const [pagina, setPagina] = useState(1)
    const [selecionados, setSelecionados] = useState<string[]>([])

    const [editando, setEditando] = useState<PostDaLista | null>(null)
    const [statusInicial, setStatusInicial] = useState<BlogStatus | undefined>()
    const [postDialogAberto, setPostDialogAberto] = useState(false)
    const [categoriasAberto, setCategoriasAberto] = useState(false)
    const [excluindo, setExcluindo] = useState<PostDaLista | null>(null)
    const [excluindoLote, setExcluindoLote] = useState(false)

    async function carregar() {
        setLoading(true)
        setAgora(Date.now())

        // Quem abre a tela também faz o relógio andar: sem pg_cron, é aqui e nas
        // rotas públicas que o agendamento vencido vira publicação. Falha em
        // silêncio de propósito — sem a migration 0018 a RPC não existe, e a
        // tela ainda precisa abrir para mostrar o aviso.
        await supabase.rpc("somos_preta_blog_publicar_agendados")

        const [listagem, catalogo, audiencia] = await Promise.all([
            supabase.from("somos_preta_blog_posts").select(COLUNAS).limit(500),
            supabase.from("somos_preta_blog_categorias").select("*").order("ordem"),
            supabase.rpc("somos_preta_blog_metricas"),
        ])

        if (listagem.error) {
            setFalhaSchema(true)
            setLoading(false)
            return
        }

        setFalhaSchema(false)
        setPosts(
            ((listagem.data ?? []) as unknown as PostDaLista[])
                .slice()
                .sort((a, b) => new Date(dataRelevante(b)).getTime() - new Date(dataRelevante(a)).getTime())
        )
        // Só substitui o que veio bem: com erro o Supabase devolve data null, e
        // o `?? []` transformaria "não consegui ler" em "não existe nada".
        if (!catalogo.error) setCategorias((catalogo.data as BlogCategoria[]) ?? [])
        if (!audiencia.error) setMetricas((audiencia.data as BlogMetrica[]) ?? [])
        setSelecionados([])
        setLoading(false)
    }

    useEffect(() => {
        carregar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Todo filtro volta para a primeira página: mantê-la deixaria o editor
    // parado numa página que não existe mais no recorte novo.
    // A seleção também é descartada: agir em massa sobre posts que saíram do
    // recorte é invisível para quem clicou — e "Excluir" não perdoa isso.
    function filtrar<T>(set: (v: T) => void) {
        return (v: T) => { set(v); setPagina(1); setSelecionados([]) }
    }

    const viewsPorPost = useMemo(
        () => new Map(metricas.map((m) => [m.post_id, Number(m.total)])),
        [metricas]
    )
    const viewsMes = useMemo(() => metricas.reduce((s, m) => s + Number(m.mes_atual), 0), [metricas])
    const viewsMesAnterior = useMemo(() => metricas.reduce((s, m) => s + Number(m.mes_anterior), 0), [metricas])

    /**
     * Responsável editorial: quem mais assina posts.
     *
     * Não existe um campo para isso, e criar um seria inventar burocracia — na
     * prática o blog tem uma pessoa que escreve, revisa e publica, e é ela que
     * o cabeçalho apresenta.
     */
    const responsavel = useMemo(() => {
        const porAutor = new Map<string, { nome: string; avatar_url: string | null; n: number }>()
        posts.forEach((p) => {
            const nome = p.autor?.nome ?? p.autor?.email
            if (!p.autor_id || !nome) return
            const atual = porAutor.get(p.autor_id)
            porAutor.set(p.autor_id, {
                nome,
                avatar_url: p.autor?.avatar_url ?? null,
                n: (atual?.n ?? 0) + 1,
            })
        })
        return [...porAutor.values()].sort((a, b) => b.n - a.n)[0] ?? null
    }, [posts])

    /** Recorte sem o filtro de status — é sobre ele que as pílulas contam. */
    const base = useMemo(() => {
        let r = posts
        const q = busca.trim().toLowerCase()
        if (q) {
            r = r.filter((p) =>
                p.titulo.toLowerCase().includes(q)
                || p.resumo?.toLowerCase().includes(q)
                || p.categoria?.toLowerCase().includes(q)
                || p.autor?.nome?.toLowerCase().includes(q)
            )
        }
        if (categoriaFiltro !== "todas") r = r.filter((p) => p.categoria === categoriaFiltro)
        if (periodo !== "todos" && agora > 0) {
            const limite = agora - Number(periodo) * 24 * 60 * 60 * 1000
            r = r.filter((p) => {
                // Agendado tem data no futuro: sem regra própria ele passaria em
                // qualquer janela, inclusive "últimos 7 dias". A regra é que o
                // que ainda vai ao ar nunca é escondido por filtro de período.
                if (p.status === "agendado") return true
                const t = new Date(dataRelevante(p)).getTime()
                return t >= limite && t <= agora
            })
        }
        return r
    }, [posts, busca, categoriaFiltro, periodo, agora])

    const filtrados = useMemo(
        () => statusFiltro === "todos" ? base : base.filter((p) => p.status === statusFiltro),
        [base, statusFiltro]
    )

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
    const paginaAtual = Math.min(pagina, totalPaginas)
    const inicio = (paginaAtual - 1) * POR_PAGINA
    const daPagina = filtrados.slice(inicio, inicio + POR_PAGINA)

    const filtrosAtivos = busca.trim() !== "" || statusFiltro !== "todos"
        || categoriaFiltro !== "todas" || periodo !== "todos"

    // ---------------------------------------------------------------- ações

    /**
     * Toda mutação pede `.select("id")` de volta.
     *
     * Um update barrado pela RLS não devolve erro — devolve zero linhas. Sem
     * conferir, a tela mostraria "salvo" para algo que não foi gravado.
     */
    async function aplicar(ids: string[], patch: Record<string, unknown>, mensagem: string) {
        const { data, error } = await supabase
            .from("somos_preta_blog_posts")
            .update(patch)
            .in("id", ids)
            .select("id")

        if (error || !data || data.length === 0) {
            toast.error("Não foi possível aplicar a alteração")
            return false
        }
        await revalidarBlog()
        toast.success(mensagem)
        await carregar()
        return true
    }

    /** Campos que acompanham cada status — o estado sozinho não basta. */
    function patchDeStatus(status: BlogStatus, publicadoEm: string | null) {
        return {
            status,
            // Publicar pela primeira vez carimba a data; republicar preserva a
            // original, que é a que o site e o sitemap mostram.
            publicado_em: status === "publicado" ? (publicadoEm ?? new Date().toISOString()) : publicadoEm,
            // Sair de "agendado" tem de limpar a data, ou a RPC de publicação
            // devolveria o post ao ar sozinha depois.
            agendado_para: null,
        }
    }

    function mudarStatus(p: PostDaLista, status: BlogStatus) {
        // Agendar exige uma data; o menu não tem onde pedi-la, então abre o post.
        if (status === "agendado") {
            setEditando(p)
            setStatusInicial("agendado")
            setPostDialogAberto(true)
            return
        }
        aplicar([p.id], patchDeStatus(status, p.publicado_em), `Post movido para ${BLOG_STATUS[status].label.toLowerCase()}`)
    }

    function destacar(p: PostDaLista) {
        aplicar([p.id], { destaque: !p.destaque }, p.destaque ? "Destaque removido" : "Post destacado")
    }

    async function duplicar(p: PostDaLista) {
        const { data: original, error: erroLeitura } = await supabase
            .from("somos_preta_blog_posts")
            .select("conteudo")
            .eq("id", p.id)
            .maybeSingle()

        // Sem esta guarda, falha de leitura e post genuinamente sem texto
        // viravam o mesmo caso — e a cópia nascia vazia anunciando sucesso.
        if (erroLeitura) { toast.error("Não foi possível ler o texto do post original"); return }

        const { data: { user } } = await supabase.auth.getUser()
        const sufixo = Math.floor(1000 + Math.random() * 9000)
        // O corte vem antes do sufixo: cortar depois poderia devolver o slug
        // original inteiro e esbarrar na restrição de unicidade.
        const slug = `${p.slug.slice(0, 45)}-copia-${sufixo}`

        const { error } = await supabase.from("somos_preta_blog_posts").insert({
            slug,
            titulo: `${p.titulo} (cópia)`,
            resumo: p.resumo,
            conteudo: original?.conteudo ?? null,
            cover_url: p.cover_url,
            categoria: p.categoria,
            tags: p.tags,
            // A cópia nasce fora do ar: duplicar não é republicar, e um destaque
            // duplicado colocaria dois posts iguais no topo do blog.
            status: "rascunho" as BlogStatus,
            destaque: false,
            autor_id: user?.id ?? null,
            publicado_em: null,
        })

        if (error) { toast.error("Não foi possível duplicar"); return }
        toast.success("Cópia criada em rascunho")
        carregar()
    }

    async function excluirPost(p: PostDaLista) {
        const { error } = await supabase.from("somos_preta_blog_posts").delete().eq("id", p.id)
        setExcluindo(null)
        if (error) { toast.error("Não foi possível excluir"); return }
        await revalidarBlog(p.slug)
        toast.success("Post excluído")
        carregar()
    }

    /**
     * Publicar em lote não pode carimbar a data de hoje em cima de quem já
     * esteve no ar: o post republicado perderia a data que o site e o sitemap
     * mostram. Daí os dois updates — só quem nunca foi publicado ganha data.
     */
    async function publicarSelecionados() {
        const escolhidos = posts.filter((p) => selecionados.includes(p.id))
        const estreantes = escolhidos.filter((p) => !p.publicado_em).map((p) => p.id)
        const reprises = escolhidos.filter((p) => p.publicado_em).map((p) => p.id)
        const agoraIso = new Date().toISOString()

        const passos = await Promise.all([
            estreantes.length
                ? supabase.from("somos_preta_blog_posts")
                    .update({ status: "publicado", publicado_em: agoraIso, agendado_para: null })
                    .in("id", estreantes).select("id")
                : null,
            reprises.length
                ? supabase.from("somos_preta_blog_posts")
                    .update({ status: "publicado", agendado_para: null })
                    .in("id", reprises).select("id")
                : null,
        ])

        const gravados = passos.reduce((n, r) => n + (r?.data?.length ?? 0), 0)
        if (gravados === 0) { toast.error("Não foi possível publicar"); return }

        await revalidarBlog()
        toast.success(gravados === 1 ? "Post publicado" : `${gravados} posts publicados`)
        carregar()
    }

    async function excluirSelecionados() {
        const { error } = await supabase.from("somos_preta_blog_posts").delete().in("id", selecionados)
        setExcluindoLote(false)
        if (error) { toast.error("Não foi possível excluir"); return }
        await revalidarBlog()
        toast.success(`${selecionados.length} ${selecionados.length === 1 ? "post excluído" : "posts excluídos"}`)
        carregar()
    }

    function alternar(id: string) {
        setSelecionados((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
    }

    function alternarTodos() {
        const idsDaPagina = daPagina.map((p) => p.id)
        const todos = idsDaPagina.every((id) => selecionados.includes(id))
        setSelecionados((s) => todos
            ? s.filter((id) => !idsDaPagina.includes(id))
            : [...new Set([...s, ...idsDaPagina])])
    }

    function limparFiltros() {
        setBusca("")
        setStatusFiltro("todos")
        setCategoriaFiltro("todas")
        setPeriodo("todos")
        setPagina(1)
        setSelecionados([])
    }

    // ---------------------------------------------------------------- render

    const pills: { valor: BlogStatus | "todos"; label: string; n: number }[] = [
        { valor: "todos", label: "Todos", n: base.length },
        ...BLOG_STATUS_ORDEM.map((s) => ({
            valor: s,
            label: BLOG_STATUS[s].label,
            n: base.filter((p) => p.status === s).length,
        })),
    ]

    return (
        <div className="space-y-5 sm:space-y-6">
            {/* ---------- cabeçalho ---------- */}
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <Newspaper className="h-6 w-6 text-primary" /> Blog
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        Gerencie os conteúdos do site da Somos Preta.
                        {responsavel && ` Todos os posts são criados, revisados e publicados por ${responsavel.nome}.`}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {responsavel && (
                        <div className="hidden items-center gap-3 rounded-2xl border bg-card px-3.5 py-2.5 lg:flex">
                            <Avatar className="h-10 w-10">
                                {responsavel.avatar_url && <AvatarImage src={responsavel.avatar_url} alt={responsavel.nome} />}
                                <AvatarFallback className="text-xs">{responsavel.nome.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="leading-tight">
                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Responsável editorial</p>
                                <p className="text-sm font-semibold">{responsavel.nome}</p>
                                <p className="text-[11px] text-muted-foreground">Escreve. Revisa. Agenda. Publica.</p>
                            </div>
                        </div>
                    )}
                    <Button variant="outline" className="rounded-xl" onClick={() => setCategoriasAberto(true)}>
                        <Settings2 className="h-4 w-4" /> Gerenciar categorias
                    </Button>
                    <Button
                        className="rounded-xl"
                        onClick={() => { setEditando(null); setStatusInicial(undefined); setPostDialogAberto(true) }}
                    >
                        <Plus className="h-4 w-4" /> Novo post
                    </Button>
                </div>
            </div>

            {falhaSchema ? (
                <Card className="border-status-atencao/40 bg-status-atencao/5">
                    <CardContent className="flex items-start gap-3 p-5">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-status-atencao" />
                        <div className="text-sm">
                            <p className="font-medium">A tela precisa da migration do fluxo editorial.</p>
                            <p className="mt-1 text-muted-foreground">
                                Aplique <code className="rounded bg-muted px-1 py-0.5 text-xs">supabase/migrations/0018_blog_editorial.sql</code>{" "}
                                no SQL Editor do Supabase e recarregue — ela cria os status novos, o destaque,
                                o catálogo de categorias e a contagem de visualizações.
                            </p>
                            <Button variant="outline" size="sm" className="mt-3 rounded-xl" onClick={carregar}>
                                Tentar de novo
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Estatisticas posts={posts} viewsMes={viewsMes} viewsMesAnterior={viewsMesAnterior} agora={agora} />

                    {/* ---------- filtros ---------- */}
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1 lg:max-w-sm">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar publicações..."
                                aria-label="Buscar publicações"
                                value={busca}
                                onChange={(e) => filtrar(setBusca)(e.target.value)}
                                className="rounded-xl pl-9"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex">
                            <DropdownSelect
                                value={statusFiltro}
                                onValueChange={(v) => filtrar(setStatusFiltro)(v as BlogStatus | "todos")}
                                aria-label="Filtrar por status"
                                options={[
                                    { value: "todos", label: "Status: todos" },
                                    ...BLOG_STATUS_ORDEM.map((s) => ({ value: s, label: BLOG_STATUS[s].label })),
                                ]}
                                className="lg:w-[170px]"
                            />
                            <DropdownSelect
                                value={categoriaFiltro}
                                onValueChange={filtrar(setCategoriaFiltro)}
                                aria-label="Filtrar por categoria"
                                options={[
                                    { value: "todas", label: "Categoria: todas" },
                                    ...categorias.map((c) => ({ value: c.nome, label: c.nome })),
                                ]}
                                className="lg:w-[180px]"
                            />
                            <DropdownSelect
                                value={periodo}
                                onValueChange={(v) => filtrar(setPeriodo)(v as BlogPeriodo)}
                                aria-label="Filtrar por período"
                                options={BLOG_PERIODOS.map((p) => ({ value: p.value, label: p.label }))}
                                className="lg:w-[170px]"
                            />
                        </div>
                        <Button
                            variant="outline"
                            className="rounded-xl lg:ml-auto"
                            onClick={limparFiltros}
                            disabled={!filtrosAtivos}
                        >
                            <Filter className="h-4 w-4" /> Limpar filtros
                        </Button>
                    </div>

                    {/* ---------- pílulas de status ---------- */}
                    <div className="flex flex-wrap gap-2">
                        {pills.map((f) => (
                            <Button
                                key={f.valor}
                                size="sm"
                                variant={statusFiltro === f.valor ? "default" : "outline"}
                                className="rounded-full"
                                onClick={() => filtrar(setStatusFiltro)(f.valor)}
                                aria-pressed={statusFiltro === f.valor}
                            >
                                {f.label}
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        "ml-1 h-5 min-w-5 justify-center px-1",
                                        statusFiltro === f.valor && "bg-primary-foreground/20 text-primary-foreground"
                                    )}
                                >
                                    {f.n}
                                </Badge>
                            </Button>
                        ))}
                    </div>

                    {/* ---------- ações em massa ---------- */}
                    {selecionados.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2">
                            <span className="text-xs text-muted-foreground">
                                {selecionados.length} {selecionados.length === 1 ? "selecionado" : "selecionados"}
                            </span>
                            <Button size="sm" variant="outline" className="rounded-xl" onClick={publicarSelecionados}>
                                <Send className="h-3.5 w-3.5" /> Publicar
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => aplicar(selecionados, { status: "despublicado", agendado_para: null }, "Posts despublicados")}>
                                <EyeOff className="h-3.5 w-3.5" /> Despublicar
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => aplicar(selecionados, { status: "arquivado", agendado_para: null }, "Posts arquivados")}>
                                <Archive className="h-3.5 w-3.5" /> Arquivar
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setExcluindoLote(true)}>
                                <Trash2 className="h-3.5 w-3.5" /> Excluir
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setSelecionados([])}>Limpar seleção</Button>
                        </div>
                    )}

                    {/* ---------- tabela ---------- */}
                    <Card>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex items-center justify-center py-16 text-muted-foreground">
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando...
                                </div>
                            ) : filtrados.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <Newspaper className="mb-3 h-10 w-10 text-muted-foreground/40" />
                                    <p className="font-medium">
                                        {posts.length === 0 ? "Nenhum post ainda" : "Nenhuma publicação com esses filtros"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {posts.length === 0
                                            ? "Crie o primeiro post em “Novo post”."
                                            : "Ajuste a busca, o status, a categoria ou o período."}
                                    </p>
                                </div>
                            ) : (
                                <TabelaPosts
                                    posts={daPagina}
                                    categorias={categorias}
                                    viewsPorPost={viewsPorPost}
                                    selecionados={selecionados}
                                    onAlternar={alternar}
                                    onAlternarTodos={alternarTodos}
                                    onEditar={(p) => { setEditando(p); setStatusInicial(undefined); setPostDialogAberto(true) }}
                                    onDestacar={destacar}
                                    onMudarStatus={mudarStatus}
                                    onDuplicar={duplicar}
                                    onExcluir={setExcluindo}
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* ---------- rodapé ---------- */}
                    {filtrados.length > 0 && (
                        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                            <p className="text-sm text-muted-foreground">
                                Mostrando {inicio + 1}–{Math.min(inicio + POR_PAGINA, filtrados.length)} de{" "}
                                {filtrados.length} {filtrados.length === 1 ? "publicação" : "publicações"}
                            </p>
                            {totalPaginas > 1 && (
                                <div className="flex flex-wrap items-center justify-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon-sm"
                                        className="rounded-lg"
                                        disabled={paginaAtual === 1}
                                        onClick={() => setPagina(paginaAtual - 1)}
                                        aria-label="Página anterior"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {paginasVisiveis(paginaAtual, totalPaginas).map((n, i) => (
                                        n === "…" ? (
                                            <span key={`sep-${i}`} className="px-1.5 text-sm text-muted-foreground">…</span>
                                        ) : (
                                            <Button
                                                key={n}
                                                variant={n === paginaAtual ? "default" : "outline"}
                                                size="icon-sm"
                                                className="rounded-lg"
                                                onClick={() => setPagina(n)}
                                                aria-current={n === paginaAtual ? "page" : undefined}
                                            >
                                                {n}
                                            </Button>
                                        )
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="icon-sm"
                                        className="rounded-lg"
                                        disabled={paginaAtual === totalPaginas}
                                        onClick={() => setPagina(paginaAtual + 1)}
                                        aria-label="Próxima página"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            <PostDialog
                post={editando}
                statusInicial={statusInicial}
                aberto={postDialogAberto}
                onOpenChange={(v) => { setPostDialogAberto(v); if (!v) { setEditando(null); setStatusInicial(undefined) } }}
                categorias={categorias}
                onSalvo={async (slug) => {
                    setPostDialogAberto(false)
                    setEditando(null)
                    setStatusInicial(undefined)
                    await revalidarBlog(slug)
                    carregar()
                }}
            />

            <CategoriasDialog
                aberto={categoriasAberto}
                onOpenChange={setCategoriasAberto}
                categorias={categorias}
                onMudou={async () => { await revalidarBlog(); await carregar() }}
            />

            <AlertDialog open={!!excluindo} onOpenChange={(v) => !v && setExcluindo(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir post?</AlertDialogTitle>
                        <AlertDialogDescription>
                            &quot;{excluindo?.titulo}&quot; será removido permanentemente. Se ele já esteve no ar,
                            o endereço passa a responder 404 — para tirá-lo do site preservando o link, use
                            &quot;Despublicar&quot; ou &quot;Arquivar&quot;.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => excluindo && excluirPost(excluindo)}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={excluindoLote} onOpenChange={setExcluindoLote}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Excluir {selecionados.length} {selecionados.length === 1 ? "post" : "posts"}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            A remoção é permanente. Os que já estiveram no ar passam a responder 404 —
                            arquivar preserva os endereços.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={excluirSelecionados}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
