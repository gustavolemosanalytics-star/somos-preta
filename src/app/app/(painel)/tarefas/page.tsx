"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useProfiles } from "@/hooks/use-profiles"
import type { Tarefa, TarefaStatus, TarefaPrioridade } from "@/lib/db/types"
import { TAREFA_STATUS, TAREFA_STATUS_ORDEM, TAREFA_PRIORIDADE, tarefaPrazoBadge } from "@/lib/constants/tarefas"
import { UserAvatar, UserPicker, UserMultiPicker } from "@/components/tarefas/user-picker"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ClipboardList, Kanban, List, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

type TarefaComCampanha = Tarefa & { campanha: { id: string; nome: string } | null }
type CampanhaOpcao = { id: string; nome: string }

const FILTROS: { value: TarefaStatus | "todas"; label: string }[] = [
    { value: "todas", label: "Todas" },
    ...TAREFA_STATUS_ORDEM.map((s) => ({ value: s, label: TAREFA_STATUS[s].label })),
]

function CardTarefa({ t, profilesById, onExcluir }: {
    t: TarefaComCampanha
    profilesById: Map<string, { nome: string | null; avatar_url: string | null }>
    onExcluir: (t: TarefaComCampanha) => void
}) {
    const prazo = tarefaPrazoBadge(t)
    const responsavel = t.responsavel ? profilesById.get(t.responsavel) : null

    return (
        <Card>
            <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <Link href={`/app/tarefas/${t.id}`} className="min-w-0 flex-1">
                        <p className={`font-medium text-sm truncate hover:text-primary ${t.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>
                            {t.titulo}
                        </p>
                    </Link>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-600 shrink-0">
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. A tarefa &quot;{t.titulo}&quot; será removida permanentemente.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onExcluir(t)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-xs font-medium ${TAREFA_PRIORIDADE[t.prioridade].className}`}>{TAREFA_PRIORIDADE[t.prioridade].label}</span>
                    {prazo && <Badge className={prazo.className} variant="secondary">{prazo.label}</Badge>}
                </div>
                <div className="flex items-center justify-between gap-2">
                    {t.campanha ? (
                        <Link href={`/app/campanhas/${t.campanha.id}`} className="text-xs text-muted-foreground hover:text-primary truncate">
                            {t.campanha.nome}
                        </Link>
                    ) : <span />}
                    {responsavel && <UserAvatar profile={responsavel} className="shrink-0" />}
                </div>
            </CardContent>
        </Card>
    )
}

export default function TarefasPage() {
    const [supabase] = useState(() => createClient())
    const { profiles } = useProfiles()
    const [tarefas, setTarefas] = useState<TarefaComCampanha[]>([])
    const [campanhas, setCampanhas] = useState<CampanhaOpcao[]>([])
    const [loading, setLoading] = useState(true)
    const [filtro, setFiltro] = useState<TarefaStatus | "todas">("todas")
    const [visao, setVisao] = useState<"board" | "lista">("board")
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        campanha_id: "", titulo: "", descricao: "",
        solicitante_id: null as string | null,
        responsavel: null as string | null,
        colaboradores: [] as string[],
        prioridade: "media" as TarefaPrioridade,
        data_inicio: "", data_entrega: "", horario: "",
    })

    const profilesById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles])

    async function load() {
        setLoading(true)
        const [{ data: ts }, { data: camps }, { data: { user } }] = await Promise.all([
            supabase.from("somos_preta_tarefas").select("*, campanha:somos_preta_campanhas(id, nome)").order("created_at", { ascending: false }),
            supabase.from("somos_preta_campanhas").select("id, nome").order("nome"),
            supabase.auth.getUser(),
        ])
        setTarefas((ts as TarefaComCampanha[]) ?? [])
        setCampanhas((camps as CampanhaOpcao[]) ?? [])
        setCurrentUserId(user?.id ?? null)
        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function abrirCriar() {
        setForm({
            campanha_id: "", titulo: "", descricao: "",
            solicitante_id: currentUserId, responsavel: null, colaboradores: [],
            prioridade: "media", data_inicio: "", data_entrega: "", horario: "",
        })
        setOpen(true)
    }

    async function criar() {
        if (!form.titulo.trim() || !form.campanha_id) return
        setSaving(true)
        const { data, error } = await supabase.from("somos_preta_tarefas").insert({
            campanha_id: form.campanha_id,
            titulo: form.titulo.trim(),
            descricao: form.descricao || null,
            solicitante_id: form.solicitante_id,
            responsavel: form.responsavel,
            prioridade: form.prioridade,
            status: "backlog",
            data_inicio: form.data_inicio || null,
            data_entrega: form.data_entrega || null,
            horario: form.horario || null,
            created_by: currentUserId,
        }).select("id").single()

        if (error || !data) { toast.error("Não foi possível criar a tarefa"); setSaving(false); return }

        if (form.colaboradores.length > 0) {
            await supabase.from("somos_preta_tarefa_colaboradores").insert(
                form.colaboradores.map((profile_id) => ({ tarefa_id: data.id, profile_id }))
            )
        }

        setSaving(false)
        setOpen(false)
        toast.success("Tarefa criada")
        load()
    }

    async function excluir(t: TarefaComCampanha) {
        const { error } = await supabase.from("somos_preta_tarefas").delete().eq("id", t.id)
        if (error) { toast.error("Erro ao excluir"); return }
        setTarefas((prev) => prev.filter((x) => x.id !== t.id))
        toast.success("Tarefa excluída")
    }

    const filtradas = useMemo(
        () => (filtro === "todas" ? tarefas : tarefas.filter((t) => t.status === filtro)),
        [tarefas, filtro]
    )

    const contagem = (s: TarefaStatus) => tarefas.filter((t) => t.status === s).length
    const atrasadas = tarefas.filter((t) => tarefaPrazoBadge(t)?.label === "Atrasada").length
    const venceHoje = tarefas.filter((t) => tarefaPrazoBadge(t)?.label === "Vence hoje").length

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <ClipboardList className="h-6 w-6 text-primary" /> Tarefas
                    </h1>
                    <p className="text-muted-foreground text-sm">Todas as tarefas das campanhas em um só lugar.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-xl border p-0.5">
                        <Button variant={visao === "board" ? "default" : "ghost"} size="sm" className="rounded-lg h-8" onClick={() => setVisao("board")}>
                            <Kanban className="h-4 w-4" /> Board
                        </Button>
                        <Button variant={visao === "lista" ? "default" : "ghost"} size="sm" className="rounded-lg h-8" onClick={() => setVisao("lista")}>
                            <List className="h-4 w-4" /> Lista
                        </Button>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-xl" onClick={abrirCriar}><Plus className="h-4 w-4" /> Nova tarefa</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Nova tarefa</DialogTitle>
                                <DialogDescription>Defina responsabilidade, prazo e prioridade.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-1.5">
                                    <Label>Campanha *</Label>
                                    <Select value={form.campanha_id} onValueChange={(v) => setForm({ ...form, campanha_id: v })}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Selecionar campanha" /></SelectTrigger>
                                        <SelectContent>{campanhas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="titulo">Título *</Label>
                                    <Input id="titulo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="descricao">Descrição</Label>
                                    <Textarea id="descricao" rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label>Solicitante</Label>
                                        <UserPicker value={form.solicitante_id} onChange={(v) => setForm({ ...form, solicitante_id: v })} placeholder="Quem solicitou" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Responsável principal</Label>
                                        <UserPicker value={form.responsavel} onChange={(v) => setForm({ ...form, responsavel: v })} placeholder="Quem responde" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Colaboradores</Label>
                                    <UserMultiPicker values={form.colaboradores} onChange={(v) => setForm({ ...form, colaboradores: v })} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label>Prioridade</Label>
                                        <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v as TarefaPrioridade })}>
                                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                            <SelectContent>{Object.entries(TAREFA_PRIORIDADE).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="horario">Horário</Label>
                                        <Input id="horario" type="time" value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="inicio">Início</Label>
                                        <Input id="inicio" type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="entrega">Prazo</Label>
                                        <Input id="entrega" type="date" value={form.data_entrega} onChange={(e) => setForm({ ...form, data_entrega: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                                <Button onClick={criar} disabled={saving || !form.titulo.trim() || !form.campanha_id}>
                                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Criar tarefa
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card><CardContent className="py-4">
                    <p className="text-2xl font-bold">{tarefas.length}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                </CardContent></Card>
                <Card><CardContent className="py-4">
                    <p className="text-2xl font-bold">{contagem("em_andamento")}</p>
                    <p className="text-xs text-muted-foreground">Em andamento</p>
                </CardContent></Card>
                <Card><CardContent className="py-4">
                    <p className="text-2xl font-bold text-amber-600">{venceHoje}</p>
                    <p className="text-xs text-muted-foreground">Vence hoje</p>
                </CardContent></Card>
                <Card><CardContent className="py-4">
                    <p className="text-2xl font-bold text-red-600">{atrasadas}</p>
                    <p className="text-xs text-muted-foreground">Atrasadas</p>
                </CardContent></Card>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
            ) : tarefas.length === 0 ? (
                <Card><CardContent className="py-14 text-center text-muted-foreground">
                    <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Nenhuma tarefa ainda</p>
                </CardContent></Card>
            ) : visao === "board" ? (
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {TAREFA_STATUS_ORDEM.map((s) => {
                        const doStatus = tarefas.filter((t) => t.status === s)
                        return (
                            <div key={s} className="w-[280px] shrink-0 space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-sm font-semibold">{TAREFA_STATUS[s].label}</h3>
                                    <Badge variant="secondary" className={TAREFA_STATUS[s].className}>{doStatus.length}</Badge>
                                </div>
                                <div className="space-y-2 min-h-[40px]">
                                    {doStatus.map((t) => (
                                        <CardTarefa key={t.id} t={t} profilesById={profilesById} onExcluir={excluir} />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <>
                    <div className="flex flex-wrap gap-2">
                        {FILTROS.map((f) => (
                            <Button key={f.value} variant={filtro === f.value ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setFiltro(f.value)}>
                                {f.label}
                            </Button>
                        ))}
                    </div>
                    {filtradas.length === 0 ? (
                        <Card><CardContent className="py-14 text-center text-muted-foreground">
                            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">Nenhuma tarefa neste status</p>
                        </CardContent></Card>
                    ) : (
                        <div className="space-y-2">
                            {filtradas.map((t) => {
                                const prazo = tarefaPrazoBadge(t)
                                const responsavel = t.responsavel ? profilesById.get(t.responsavel) : null
                                return (
                                    <Card key={t.id}>
                                        <CardContent className="flex items-center gap-3 py-3">
                                            <div className="flex-1 min-w-0">
                                                <Link href={`/app/tarefas/${t.id}`} className="hover:text-primary">
                                                    <p className={`font-medium truncate ${t.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>{t.titulo}</p>
                                                </Link>
                                                <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground mt-0.5">
                                                    <span className={TAREFA_PRIORIDADE[t.prioridade].className}>{TAREFA_PRIORIDADE[t.prioridade].label}</span>
                                                    {t.campanha && <Link href={`/app/campanhas/${t.campanha.id}`} className="hover:text-primary">• {t.campanha.nome}</Link>}
                                                    {t.data_entrega && <span>• entrega {t.data_entrega}</span>}
                                                    {prazo && <Badge className={prazo.className} variant="secondary">{prazo.label}</Badge>}
                                                </div>
                                            </div>
                                            {responsavel && <UserAvatar profile={responsavel} />}
                                            <Badge className={TAREFA_STATUS[t.status].className} variant="secondary">{TAREFA_STATUS[t.status].label}</Badge>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta ação não pode ser desfeita. A tarefa &quot;{t.titulo}&quot; será removida permanentemente.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => excluir(t)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
