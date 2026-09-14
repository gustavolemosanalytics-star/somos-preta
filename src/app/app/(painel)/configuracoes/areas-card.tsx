"use client"

import { useState } from "react"
import { Check, ChevronDownIcon, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { BLOG_CORES, classeDaCor } from "@/lib/constants/blog"
import { createClient } from "@/lib/supabase/client"
import type { Area } from "@/lib/db/types"
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
 * Catálogo de áreas da PRETA.
 *
 * A cor não é enfeite: é ela que pinta o bloco da tarefa na grade do
 * calendário, então mudar aqui muda a leitura daquela tela.
 */
export function AreasCard({ areas, onMudou }: { areas: Area[]; onMudou: () => Promise<void> | void }) {
    const [supabase] = useState(() => createClient())
    const [rascunhos, setRascunhos] = useState<Record<string, { nome: string; cor: string }>>({})
    const [ocupado, setOcupado] = useState<string | null>(null)
    const [confirmando, setConfirmando] = useState<string | null>(null)
    const [nova, setNova] = useState({ nome: "", cor: "neutro" })
    const [criando, setCriando] = useState(false)

    function sincronizar(id: string) {
        setRascunhos((r) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== id)))
    }

    function alterada(a: Area) {
        const r = rascunhos[a.id]
        return !!r && (r.nome.trim() !== a.nome || r.cor !== a.cor)
    }

    /** Slug simples, igual ao que a migration faz no banco. */
    function slug(nome: string) {
        return nome.toLowerCase().normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "area"
    }

    async function salvar(a: Area) {
        const r = rascunhos[a.id]
        if (!r?.nome.trim()) { toast.error("O nome não pode ficar vazio"); return }
        setOcupado(a.id)
        const { data, error } = await supabase
            .from("somos_preta_areas")
            .update({ nome: r.nome.trim(), slug: slug(r.nome), cor: r.cor })
            .eq("id", a.id)
            .select("id")
        setOcupado(null)
        if (error || !data?.length) {
            toast.error(error?.message.includes("duplicate") ? "Já existe uma área com esse nome" : "Não foi possível salvar")
            return
        }
        toast.success("Área atualizada")
        await onMudou()
        sincronizar(a.id)
    }

    async function excluir(a: Area) {
        setOcupado(a.id)
        const { error } = await supabase.from("somos_preta_areas").delete().eq("id", a.id)
        setOcupado(null)
        setConfirmando(null)
        if (error) { toast.error("Não foi possível excluir"); return }
        toast.success("Área excluída")
        await onMudou()
        sincronizar(a.id)
    }

    async function criar(e: React.FormEvent) {
        e.preventDefault()
        if (!nova.nome.trim()) return
        setCriando(true)
        const { error } = await supabase.from("somos_preta_areas").insert({
            nome: nova.nome.trim(),
            slug: slug(nova.nome),
            cor: nova.cor,
            ordem: areas.length + 1,
        })
        setCriando(false)
        if (error) {
            toast.error(error.message.includes("duplicate") ? "Essa área já existe" : "Não foi possível criar")
            return
        }
        toast.success("Área criada")
        setNova({ nome: "", cor: "neutro" })
        await onMudou()
    }

    return (
        <Card>
            <CardContent className="space-y-3 p-5">
                <div>
                    <p className="text-sm font-semibold">Áreas</p>
                    <p className="text-xs text-muted-foreground">
                        Organizam as tarefas e dão a cor dos blocos no calendário.
                    </p>
                </div>

                {areas.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        Nenhuma área ainda. Crie a primeira abaixo.
                    </p>
                )}

                {areas.map((a) => {
                    const r = rascunhos[a.id] ?? { nome: a.nome, cor: a.cor }

                    if (confirmando === a.id) {
                        return (
                            <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-2.5">
                                <span className="flex-1 text-sm">
                                    Excluir <strong>{a.nome}</strong>? As tarefas dessa área ficam sem área.
                                </span>
                                <Button size="sm" variant="ghost" onClick={() => setConfirmando(null)}>Cancelar</Button>
                                <Button size="sm" disabled={ocupado === a.id} onClick={() => excluir(a)} className="bg-destructive text-white hover:bg-destructive/90">
                                    {ocupado === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Excluir"}
                                </Button>
                            </div>
                        )
                    }

                    return (
                        <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-xl border p-2.5">
                            <Input
                                value={r.nome}
                                onChange={(e) => setRascunhos({ ...rascunhos, [a.id]: { ...r, nome: e.target.value } })}
                                className="h-8 flex-1 min-w-[140px]"
                                aria-label={`Nome da área ${a.nome}`}
                            />
                            <SeletorDeCor cor={r.cor} onChange={(cor) => setRascunhos({ ...rascunhos, [a.id]: { ...r, cor } })} />
                            <Badge variant="secondary" className={cn("hidden sm:inline-flex", classeDaCor(r.cor))}>
                                {r.nome.trim() || "—"}
                            </Badge>
                            {alterada(a) && (
                                <Button size="icon-sm" variant="ghost" disabled={ocupado === a.id} onClick={() => salvar(a)} aria-label="Salvar área">
                                    {ocupado === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-status-sucesso" />}
                                </Button>
                            )}
                            <Button
                                size="icon-sm" variant="ghost"
                                onClick={() => setConfirmando(a.id)}
                                aria-label={`Excluir área ${a.nome}`}
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
                        placeholder="Nova área"
                        className="h-8 flex-1 min-w-[140px]"
                        aria-label="Nome da nova área"
                    />
                    <SeletorDeCor cor={nova.cor} onChange={(cor) => setNova({ ...nova, cor })} />
                    <Button type="submit" size="sm" variant="outline" disabled={criando || !nova.nome.trim()} className="rounded-xl">
                        {criando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Adicionar
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
