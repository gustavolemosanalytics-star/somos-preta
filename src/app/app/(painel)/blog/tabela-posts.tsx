"use client"

import {
    Archive, Copy, ExternalLink, MoreHorizontal, Pencil, Star, Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
    DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BLOG_STATUS, BLOG_STATUS_ORDEM, classeDaCor, dataEmDuasLinhas } from "@/lib/constants/blog"
import { SITE_URL } from "@/lib/constants/site"
import type { BlogCategoria, BlogStatus } from "@/lib/db/types"
import { cn } from "@/lib/utils"
import type { PostDaLista } from "./tipos"

/** Capas de reserva, para post sem imagem própria não abrir um buraco na linha. */
const CAPAS = ["/blog/post-1.svg", "/blog/post-2.svg", "/blog/post-3.svg", "/blog/post-4.svg"]

const fmt = (n: number) => n.toLocaleString("pt-BR")

function DataCelula({ iso, relativa }: { iso: string | null; relativa?: boolean }) {
    const d = dataEmDuasLinhas(iso, relativa)
    if (!d) return <span className="text-muted-foreground">—</span>
    return (
        <div className="leading-tight">
            <span className="block">{d.data}</span>
            <span className="block text-xs text-muted-foreground">{d.hora}</span>
        </div>
    )
}

function Autor({ post }: { post: PostDaLista }) {
    const nome = post.autor?.nome ?? post.autor?.email ?? "Sem autor"
    return (
        <span className="mt-1 flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
            <Avatar className="h-4 w-4">
                {post.autor?.avatar_url && <AvatarImage src={post.autor.avatar_url} alt={nome} />}
                <AvatarFallback className="text-[8px]">{nome.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            por {nome}
        </span>
    )
}

export function TabelaPosts({
    posts, categorias, viewsPorPost, selecionados,
    onAlternar, onAlternarTodos, onEditar, onDestacar, onMudarStatus, onDuplicar, onExcluir,
}: {
    posts: PostDaLista[]
    categorias: BlogCategoria[]
    viewsPorPost: Map<string, number>
    selecionados: string[]
    onAlternar: (id: string) => void
    onAlternarTodos: () => void
    onEditar: (p: PostDaLista) => void
    onDestacar: (p: PostDaLista) => void
    onMudarStatus: (p: PostDaLista, status: BlogStatus) => void
    onDuplicar: (p: PostDaLista) => void
    onExcluir: (p: PostDaLista) => void
}) {
    const todos = posts.length > 0 && posts.every((p) => selecionados.includes(p.id))
    const alguns = posts.some((p) => selecionados.includes(p.id))

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-10">
                        {/*
                          Duas correções locais:
                          — o Checkbox renderiza o MESMO ícone de "marcado" no estado
                            indeterminado, então a diferença vem do fundo: cheio =
                            página inteira selecionada, esmaecido = parte dela;
                          — min-h-0/min-w-0 desfaz aqui a regra de alvo de toque de
                            44px do globals.css, que infla a caixa de 16px do Radix
                            (um <button>) e estoura a coluna.
                        */}
                        <Checkbox
                            checked={alguns && !todos ? "indeterminate" : todos}
                            onCheckedChange={onAlternarTodos}
                            aria-label="Selecionar todas as publicações desta página"
                            className="min-h-0 min-w-0 data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary/40 data-[state=indeterminate]:text-primary-foreground"
                        />
                    </TableHead>
                    <TableHead>Publicação</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Data de publicação</TableHead>
                    <TableHead className="hidden xl:table-cell">Última edição</TableHead>
                    <TableHead className="hidden lg:table-cell">Destaque</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Visualizações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {posts.map((p, i) => {
                    const capa = p.cover_url || CAPAS[i % CAPAS.length]
                    const cor = categorias.find((c) => c.nome === p.categoria)?.cor
                    const views = viewsPorPost.get(p.id) ?? 0
                    // Um post agendado ainda não tem data de publicação: o que a
                    // coluna deve mostrar é a data marcada para ele entrar no ar.
                    const dataVitrine = p.status === "agendado" ? p.agendado_para : p.publicado_em

                    return (
                        <TableRow key={p.id} data-state={selecionados.includes(p.id) ? "selected" : undefined}>
                            <TableCell>
                                <Checkbox
                                    checked={selecionados.includes(p.id)}
                                    onCheckedChange={() => onAlternar(p.id)}
                                    aria-label={`Selecionar ${p.titulo}`}
                                    className="min-h-0 min-w-0"
                                />
                            </TableCell>

                            <TableCell className="max-w-[320px] font-medium whitespace-normal">
                                <div className="flex items-start gap-3">
                                    {/*
                                      <img> e não next/image: cover_url é uma URL
                                      digitada à mão, de host arbitrário, e o projeto
                                      não declara images.remotePatterns — o otimizador
                                      quebraria em runtime.
                                    */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={capa}
                                        alt=""
                                        className="h-10 w-10 shrink-0 rounded-lg object-cover bg-muted"
                                    />
                                    <span className="min-w-0">
                                        <button
                                            type="button"
                                            onClick={() => onEditar(p)}
                                            className="block h-auto min-h-0 max-w-full truncate text-left leading-snug hover:text-primary"
                                            title={p.titulo}
                                        >
                                            {p.titulo}
                                        </button>
                                        <Autor post={p} />
                                    </span>
                                </div>
                            </TableCell>

                            <TableCell className="hidden md:table-cell">
                                {p.categoria
                                    ? <Badge variant="secondary" className={classeDaCor(cor)}>{p.categoria}</Badge>
                                    : <span className="text-muted-foreground">—</span>}
                            </TableCell>

                            <TableCell>
                                <Badge variant="secondary" className={BLOG_STATUS[p.status].className}>
                                    {BLOG_STATUS[p.status].label}
                                </Badge>
                            </TableCell>

                            <TableCell className="hidden lg:table-cell">
                                <DataCelula iso={dataVitrine} />
                            </TableCell>

                            <TableCell className="hidden xl:table-cell">
                                <DataCelula iso={p.updated_at} relativa />
                            </TableCell>

                            <TableCell className="hidden lg:table-cell">
                                {p.destaque
                                    ? (
                                        <Badge variant="secondary" className="bg-status-atencao/12 text-status-atencao">
                                            <Star className="h-3 w-3 fill-current" /> Destaque
                                        </Badge>
                                    )
                                    : <span className="text-muted-foreground">—</span>}
                            </TableCell>

                            <TableCell className="hidden sm:table-cell text-right tabular-nums">
                                {views > 0 ? fmt(views) : <span className="text-muted-foreground">—</span>}
                            </TableCell>

                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon-sm" aria-label={`Ações de ${p.titulo}`} title="Mais ações">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52">
                                        <DropdownMenuItem onClick={() => onEditar(p)}>
                                            <Pencil className="h-4 w-4" /> Editar
                                        </DropdownMenuItem>
                                        {p.status === "publicado" && (
                                            <DropdownMenuItem asChild>
                                                {/*
                                                  Link absoluto: o painel é servido em
                                                  plataforma.somospreta.com, onde o middleware
                                                  reescreve /blog/... para dentro do painel.
                                                  Um href relativo aqui dá 404.
                                                */}
                                                <a href={`${SITE_URL}/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4" /> Ver no site
                                                </a>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => onDestacar(p)}>
                                            <Star className={cn("h-4 w-4", p.destaque && "fill-current")} />
                                            {p.destaque ? "Remover destaque" : "Destacar no blog"}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                <Archive className="h-4 w-4" /> Mudar status
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                {BLOG_STATUS_ORDEM.map((s) => (
                                                    <DropdownMenuItem
                                                        key={s}
                                                        disabled={s === p.status}
                                                        onClick={() => onMudarStatus(p, s)}
                                                    >
                                                        {BLOG_STATUS[s].label}
                                                        {s === "agendado" && <span className="text-muted-foreground">…</span>}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        <DropdownMenuItem onClick={() => onDuplicar(p)}>
                                            <Copy className="h-4 w-4" /> Duplicar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem variant="destructive" onClick={() => onExcluir(p)}>
                                            <Trash2 className="h-4 w-4" /> Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}
