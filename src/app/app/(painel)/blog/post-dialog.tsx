"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { DropdownSelect } from "@/components/ui/dropdown-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
    BLOG_STATUS, BLOG_STATUS_ORDEM, paraDatetimeLocal,
} from "@/lib/constants/blog"
import { createClient } from "@/lib/supabase/client"
import type { BlogCategoria, BlogStatus } from "@/lib/db/types"
import type { PostDaLista } from "./tipos"

const SEM_CATEGORIA = "__sem__"

function slugify(s: string) {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "post"
}

type Formulario = {
    titulo: string
    categoria: string
    resumo: string
    conteudo: string
    cover_url: string
    status: BlogStatus
    agendado_para: string
    destaque: boolean
}

const VAZIO: Formulario = {
    titulo: "", categoria: SEM_CATEGORIA, resumo: "", conteudo: "", cover_url: "",
    status: "rascunho", agendado_para: "", destaque: false,
}

/**
 * Criação e edição de post no mesmo diálogo — os campos são os mesmos, e manter
 * dois formulários gêmeos era como os dois se afastavam a cada mudança.
 *
 * O `conteudo` não vem na listagem (é o campo mais pesado da tabela), então a
 * edição o busca aqui, sob demanda.
 */
export function PostDialog({ post, statusInicial, aberto, onOpenChange, categorias, onSalvo }: {
    post: PostDaLista | null
    statusInicial?: BlogStatus
    aberto: boolean
    onOpenChange: (v: boolean) => void
    categorias: BlogCategoria[]
    onSalvo: (slug?: string) => void
}) {
    const [supabase] = useState(() => createClient())
    const [form, setForm] = useState<Formulario>(VAZIO)
    const [carregando, setCarregando] = useState(false)
    const [falhaConteudo, setFalhaConteudo] = useState(false)
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    useEffect(() => {
        if (!aberto) return
        setErro(null)
        setFalhaConteudo(false)

        if (!post) {
            setForm({ ...VAZIO, status: statusInicial ?? "rascunho" })
            return
        }

        setForm({
            titulo: post.titulo,
            categoria: post.categoria ?? SEM_CATEGORIA,
            resumo: post.resumo ?? "",
            conteudo: "",
            cover_url: post.cover_url ?? "",
            status: statusInicial ?? post.status,
            agendado_para: paraDatetimeLocal(post.agendado_para),
            destaque: post.destaque,
        })

        // O diálogo nunca desmonta (só `aberto` muda), então a resposta de um
        // post aberto antes continua viva e chegaria depois — escrevendo o texto
        // do post anterior dentro do formulário do atual. `vivo` a descarta.
        let vivo = true
        setCarregando(true)
        supabase
            .from("somos_preta_blog_posts")
            .select("conteudo")
            .eq("id", post.id)
            .maybeSingle()
            .then(({ data, error }) => {
                if (!vivo) return
                // Erro de leitura não pode virar "post sem texto": salvar em
                // cima disso apagaria o conteúdo real.
                if (error) setFalhaConteudo(true)
                else setForm((f) => ({ ...f, conteudo: data?.conteudo ?? "" }))
                setCarregando(false)
            })

        return () => { vivo = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aberto, post?.id, statusInicial])

    /** Campos comuns ao insert e ao update, já normalizados para o banco. */
    function camposBase() {
        return {
            titulo: form.titulo.trim(),
            categoria: form.categoria === SEM_CATEGORIA ? null : form.categoria,
            resumo: form.resumo.trim() || null,
            conteudo: form.conteudo.trim() || null,
            cover_url: form.cover_url.trim() || null,
            status: form.status,
            destaque: form.destaque,
            // Agendamento só faz sentido enquanto o post está agendado; deixar a
            // data para trás faria a RPC de publicação republicar um post já no ar.
            agendado_para: form.status === "agendado"
                ? new Date(form.agendado_para).toISOString()
                : null,
        }
    }

    async function salvar(e: React.FormEvent) {
        e.preventDefault()
        // O texto do post chega por uma segunda consulta. Salvar antes dela —
        // ou depois de ela falhar — gravaria `conteudo: null` por cima do post.
        if (carregando) return
        if (falhaConteudo) {
            setErro("Não foi possível carregar o texto deste post. Feche e abra de novo antes de salvar.")
            return
        }
        if (!form.titulo.trim()) {
            setErro("O título é obrigatório.")
            return
        }
        if (form.status === "agendado") {
            const quando = new Date(form.agendado_para)
            if (!form.agendado_para || Number.isNaN(quando.getTime())) {
                setErro("Escolha a data e a hora do agendamento.")
                return
            }
            if (quando.getTime() <= Date.now()) {
                setErro("O agendamento precisa ser no futuro. Para publicar agora, escolha o status Publicado.")
                return
            }
        }

        setErro(null)
        setSalvando(true)

        if (post) {
            const { error } = await supabase
                .from("somos_preta_blog_posts")
                .update({
                    ...camposBase(),
                    // Publicar pela primeira vez carimba a data; republicar preserva
                    // a original, que é o que o site e o sitemap mostram.
                    publicado_em: form.status === "publicado"
                        ? (post.publicado_em ?? new Date().toISOString())
                        : post.publicado_em,
                })
                .eq("id", post.id)
            setSalvando(false)
            if (error) { toast.error("Não foi possível salvar as alterações"); return }
            toast.success("Post atualizado")
            onSalvo(post.slug)
            return
        }

        const { data: { user } } = await supabase.auth.getUser()
        const base = slugify(form.titulo)
        let slugGravado: string | null = null

        // O slug é único no banco. Em vez de consultar antes (e ainda assim
        // correr o risco de colisão entre duas abas), tenta e trata o 23505.
        for (let tentativa = 0; tentativa < 3 && !slugGravado; tentativa++) {
            const slug = tentativa === 0 ? base : `${base}-${Math.floor(1000 + Math.random() * 9000)}`
            const { error } = await supabase.from("somos_preta_blog_posts").insert({
                ...camposBase(),
                slug,
                tags: [],
                autor_id: user?.id ?? null,
                publicado_em: form.status === "publicado" ? new Date().toISOString() : null,
            })
            if (!error) { slugGravado = slug; break }
            if (error.code !== "23505") {
                setSalvando(false)
                toast.error("Não foi possível criar o post")
                return
            }
        }

        setSalvando(false)
        if (!slugGravado) { toast.error("Já existe um post com esse endereço. Ajuste o título."); return }
        toast.success("Post criado")
        onSalvo(slugGravado)
    }

    const opcoesCategoria = [
        { value: SEM_CATEGORIA, label: "Sem categoria" },
        ...categorias.map((c) => ({ value: c.nome, label: c.nome })),
    ]

    return (
        <Dialog open={aberto} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={salvar}>
                    <DialogHeader>
                        <DialogTitle>{post ? "Editar post" : "Novo post"}</DialogTitle>
                        <DialogDescription>
                            {post
                                ? "As alterações vão ao ar assim que você salvar."
                                : "O post nasce em rascunho; escolha o status quando quiser publicar ou agendar."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="titulo">Título *</Label>
                            <Input
                                id="titulo"
                                value={form.titulo}
                                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                                aria-invalid={!!erro && !form.titulo.trim()}
                                required
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="categoria">Categoria</Label>
                                <DropdownSelect
                                    id="categoria"
                                    value={form.categoria}
                                    onValueChange={(v) => setForm({ ...form, categoria: v })}
                                    options={opcoesCategoria}
                                    placeholder="Sem categoria"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="capa">Imagem de capa (URL)</Label>
                                <Input
                                    id="capa"
                                    type="url"
                                    placeholder="https://..."
                                    value={form.cover_url}
                                    onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="resumo">Resumo</Label>
                            <Textarea
                                id="resumo"
                                placeholder="A chamada que aparece na listagem do blog."
                                value={form.resumo}
                                onChange={(e) => setForm({ ...form, resumo: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="conteudo">Conteúdo</Label>
                            <Textarea
                                id="conteudo"
                                value={form.conteudo}
                                onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                                className="min-h-[200px]"
                                disabled={carregando || falhaConteudo}
                                placeholder={carregando ? "Carregando o texto..." : falhaConteudo ? "Texto indisponível" : undefined}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <DropdownSelect
                                    id="status"
                                    value={form.status}
                                    onValueChange={(v) => setForm({ ...form, status: v as BlogStatus })}
                                    options={BLOG_STATUS_ORDEM.map((s) => ({ value: s, label: BLOG_STATUS[s].label }))}
                                />
                            </div>
                            {form.status === "agendado" && (
                                <div className="grid gap-2">
                                    <Label htmlFor="agendamento">Publicar em *</Label>
                                    <Input
                                        id="agendamento"
                                        type="datetime-local"
                                        value={form.agendado_para}
                                        onChange={(e) => setForm({ ...form, agendado_para: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>

                        <label className="flex items-center gap-3 text-sm">
                            {/*
                              Sem min-h-0/min-w-0 a regra de 44px do globals.css
                              transforma o trilho do Switch (um <button role="switch">)
                              num círculo de 44px, e ligado/desligado ficam iguais.
                            */}
                            <Switch
                                checked={form.destaque}
                                onCheckedChange={(v) => setForm({ ...form, destaque: v })}
                                className="min-h-0 min-w-0"
                            />
                            Destacar no topo do blog
                        </label>

                        {erro && <p className="text-xs text-destructive">{erro}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={salvando || carregando || falhaConteudo} className="rounded-xl">
                            {salvando || carregando
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : post ? "Salvar alterações" : "Criar post"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
