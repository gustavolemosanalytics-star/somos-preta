"use client"

import { useState } from "react"
import { Check, ChevronDownIcon, Loader2, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { BLOG_CORES, classeDaCor } from "@/lib/constants/blog"
import { createClient } from "@/lib/supabase/client"
import type { BlogCategoria } from "@/lib/db/types"
import { cn } from "@/lib/utils"

function SeletorDeCor({ cor, onChange }: { cor: string; onChange: (c: string) => void }) {
    const atual = BLOG_CORES.find((c) => c.valor === cor) ?? BLOG_CORES[BLOG_CORES.length - 1]
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="w-[128px] justify-between font-normal">
                    <span className={cn("h-3 w-3 shrink-0 rounded-full", atual.className)} />
                    <span className="flex-1 truncate text-left">{atual.label}</span>
                    <ChevronDownIcon className="h-3.5 w-3.5 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {BLOG_CORES.map((c) => (
                    <DropdownMenuItem key={c.valor} onClick={() => onChange(c.valor)}>
                        <span className={cn("h-3 w-3 rounded-full", c.className)} />
                        {c.label}
                        {c.valor === cor && <Check className="ml-auto h-3.5 w-3.5" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

/**
 * Catálogo de categorias do blog.
 *
 * Renomear e excluir passam por RPC (e não por update direto) porque o post
 * guarda a categoria como texto: as duas operações precisam alcançar os posts
 * na mesma transação, ou sobram posts apontando para um rótulo que não existe
 * mais — invisíveis no filtro do site.
 */
export function CategoriasDialog({ aberto, onOpenChange, categorias, onMudou }: {
    aberto: boolean
    onOpenChange: (v: boolean) => void
    categorias: BlogCategoria[]
    /** Devolve a promise do recarregamento: o rascunho da linha só pode ser
     *  descartado quando o valor novo já estiver nos props. */
    onMudou: () => Promise<void> | void
}) {
    const [supabase] = useState(() => createClient())
    const [rascunhos, setRascunhos] = useState<Record<string, { nome: string; cor: string }>>({})
    const [salvandoId, setSalvandoId] = useState<string | null>(null)
    const [confirmando, setConfirmando] = useState<string | null>(null)
    const [nova, setNova] = useState({ nome: "", cor: "neutro" })
    const [criando, setCriando] = useState(false)

    /**
     * `rascunhos` guarda só o que foi mexido — o render cai no valor vindo do
     * banco para todo o resto. Sincronizar a lista inteira num efeito a cada
     * abertura seria uma cascata de renders para reescrever o que já se tem.
     */
    function fechar(v: boolean) {
        if (!v) {
            setRascunhos({})
            setNova({ nome: "", cor: "neutro" })
            setConfirmando(null)
        }
        onOpenChange(v)
    }

    /** Descarta o rascunho da linha para ela voltar a espelhar o banco. */
    function sincronizar(id: string) {
        setRascunhos((r) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== id)))
    }

    function alterada(c: BlogCategoria) {
        const r = rascunhos[c.id]
        return !!r && (r.nome.trim() !== c.nome || r.cor !== c.cor)
    }

    async function salvar(c: BlogCategoria) {
        const r = rascunhos[c.id]
        if (!r?.nome.trim()) { toast.error("O nome não pode ficar vazio"); return }
        setSalvandoId(c.id)
        const { error } = await supabase.rpc("somos_preta_blog_salvar_categoria", {
            p_id: c.id, p_nome: r.nome.trim(), p_cor: r.cor,
        })
        setSalvandoId(null)
        if (error) { toast.error(error.message.includes("duplicate") ? "Já existe uma categoria com esse nome" : "Não foi possível salvar"); return }
        toast.success("Categoria atualizada")
        await onMudou()
        sincronizar(c.id)
    }

    async function excluir(c: BlogCategoria) {
        setSalvandoId(c.id)
        const { error } = await supabase.rpc("somos_preta_blog_excluir_categoria", { p_id: c.id })
        setSalvandoId(null)
        setConfirmando(null)
        if (error) { toast.error("Não foi possível excluir"); return }
        toast.success("Categoria excluída")
        await onMudou()
        sincronizar(c.id)
    }

    async function criar(e: React.FormEvent) {
        e.preventDefault()
        if (!nova.nome.trim()) return
        setCriando(true)
        const { error } = await supabase.rpc("somos_preta_blog_salvar_categoria", {
            p_id: null, p_nome: nova.nome.trim(), p_cor: nova.cor,
        })
        setCriando(false)
        if (error) { toast.error(error.message.includes("duplicate") ? "Essa categoria já existe" : "Não foi possível criar"); return }
        toast.success("Categoria criada")
        setNova({ nome: "", cor: "neutro" })
        await onMudou()
    }

    return (
        <Dialog open={aberto} onOpenChange={fechar}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Gerenciar categorias</DialogTitle>
                    <DialogDescription>
                        As categorias organizam o blog e alimentam os filtros do site.
                        Renomear atualiza os posts que já usam a categoria.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-2">
                    {categorias.length === 0 && (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            Nenhuma categoria ainda. Crie a primeira abaixo.
                        </p>
                    )}

                    {categorias.map((c) => {
                        const r = rascunhos[c.id] ?? { nome: c.nome, cor: c.cor }
                        const ocupado = salvandoId === c.id

                        if (confirmando === c.id) {
                            return (
                                <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-2.5">
                                    <span className="flex-1 text-sm">
                                        Excluir <strong>{c.nome}</strong>? Os posts dessa categoria ficam sem categoria.
                                    </span>
                                    <Button size="sm" variant="ghost" onClick={() => setConfirmando(null)}>Cancelar</Button>
                                    <Button size="sm" disabled={ocupado} onClick={() => excluir(c)} className="bg-destructive text-white hover:bg-destructive/90">
                                        {ocupado ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Excluir"}
                                    </Button>
                                </div>
                            )
                        }

                        return (
                            <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-xl border p-2.5">
                                <Input
                                    value={r.nome}
                                    onChange={(e) => setRascunhos({ ...rascunhos, [c.id]: { ...r, nome: e.target.value } })}
                                    className="h-8 flex-1 min-w-[140px]"
                                    aria-label={`Nome da categoria ${c.nome}`}
                                />
                                <SeletorDeCor cor={r.cor} onChange={(cor) => setRascunhos({ ...rascunhos, [c.id]: { ...r, cor } })} />
                                <Badge variant="secondary" className={cn("hidden sm:inline-flex", classeDaCor(r.cor))}>
                                    {r.nome.trim() || "—"}
                                </Badge>
                                {alterada(c) ? (
                                    <Button size="icon-sm" variant="ghost" disabled={ocupado} onClick={() => salvar(c)} aria-label="Salvar categoria" title="Salvar">
                                        {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-status-sucesso" />}
                                    </Button>
                                ) : (
                                    <Button size="icon-sm" variant="ghost" disabled aria-hidden className="opacity-0 pointer-events-none">
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    onClick={() => setConfirmando(c.id)}
                                    aria-label={`Excluir categoria ${c.nome}`}
                                    title="Excluir"
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )
                    })}

                    <form onSubmit={criar} className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed p-2.5">
                        <Input
                            value={nova.nome}
                            onChange={(e) => setNova({ ...nova, nome: e.target.value })}
                            placeholder="Nova categoria"
                            className="h-8 flex-1 min-w-[140px]"
                            aria-label="Nome da nova categoria"
                        />
                        <SeletorDeCor cor={nova.cor} onChange={(cor) => setNova({ ...nova, cor })} />
                        <Button type="submit" size="sm" variant="outline" disabled={criando || !nova.nome.trim()} className="rounded-xl">
                            {criando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                            Adicionar
                        </Button>
                    </form>
                </div>

                <DialogFooter>
                    <Button variant="outline" className="rounded-xl" onClick={() => fechar(false)}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
