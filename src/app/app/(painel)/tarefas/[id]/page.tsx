"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useProfiles } from "@/hooks/use-profiles"
import type { Tarefa, TarefaEvento, TarefaStatus, TarefaPrioridade, TarefaAnexo } from "@/lib/db/types"
import { TAREFA_STATUS, TAREFA_STATUS_ORDEM, TAREFA_PRIORIDADE, tarefaPrazoBadge } from "@/lib/constants/tarefas"
import { UserPicker, UserMultiPicker } from "@/components/tarefas/user-picker"
import { Timeline } from "@/components/tarefas/timeline"
import { SubtarefasSection } from "@/components/tarefas/subtarefas-section"
import { AnexosSection } from "@/components/tarefas/anexos-section"
import { ComentariosSection } from "@/components/tarefas/comentarios-section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Building2, ClipboardList, History, Loader2, Megaphone, Paperclip, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

type TarefaDetalhe = Tarefa & {
    campanha: { id: string; nome: string; cliente: { id: string; nome: string } | null } | null
    influencer: { id: string; nome: string } | null
}

function ConcluirDialog({ tarefaId, obrigatoria, open, onOpenChange, onConfirmar }: {
    tarefaId: string
    obrigatoria: boolean
    open: boolean
    onOpenChange: (o: boolean) => void
    onConfirmar: (observacao: string) => Promise<void>
}) {
    const [observacao, setObservacao] = useState("")
    const [evidencias, setEvidencias] = useState<TarefaAnexo[]>([])
    const [salvando, setSalvando] = useState(false)

    async function confirmar() {
        if (obrigatoria && evidencias.length === 0) {
            toast.error("Anexe uma evidência para concluir esta tarefa")
            return
        }
        setSalvando(true)
        await onConfirmar(observacao)
        setSalvando(false)
        setObservacao("")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Concluir tarefa</DialogTitle>
                    <DialogDescription>
                        {obrigatoria ? "Esta tarefa exige evidência de conclusão." : "Adicione uma evidência ou observação, se quiser."}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <AnexosSection tarefaId={tarefaId} apenasEvidencia onChange={setEvidencias} />
                    <div className="space-y-1.5">
                        <Label>Observação final</Label>
                        <Textarea rows={3} placeholder="Como foi a entrega?" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={confirmar} disabled={salvando}>
                        {salvando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Concluir
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function TarefaDetalhePage() {
    const { id: tarefaId } = useParams<{ id: string }>()
    const router = useRouter()
    const [supabase] = useState(() => createClient())
    const { profiles } = useProfiles()

    const [tarefa, setTarefa] = useState<TarefaDetalhe | null>(null)
    const [colaboradores, setColaboradores] = useState<string[]>([])
    const [eventos, setEventos] = useState<TarefaEvento[]>([])
    const [loading, setLoading] = useState(true)
    const [titulo, setTitulo] = useState("")
    const [descricao, setDescricao] = useState("")
    const [concluirOpen, setConcluirOpen] = useState(false)

    async function load() {
        const [{ data: t }, { data: colabs }, { data: evts }] = await Promise.all([
            supabase
                .from("somos_preta_tarefas")
                .select("*, campanha:somos_preta_campanhas(id, nome, cliente:somos_preta_clientes(id, nome)), influencer:somos_preta_influencers(id, nome)")
                .eq("id", tarefaId)
                .single(),
            supabase.from("somos_preta_tarefa_colaboradores").select("profile_id").eq("tarefa_id", tarefaId),
            supabase.from("somos_preta_tarefa_eventos").select("*").eq("tarefa_id", tarefaId).order("created_at", { ascending: false }),
        ])
        const td = t as TarefaDetalhe | null
        setTarefa(td)
        if (td) { setTitulo(td.titulo); setDescricao(td.descricao ?? "") }
        setColaboradores(((colabs as { profile_id: string }[]) ?? []).map((c) => c.profile_id))
        setEventos((evts as TarefaEvento[]) ?? [])
        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tarefaId])

    async function atualizar(patch: Partial<Tarefa>) {
        const { error } = await supabase.from("somos_preta_tarefas").update(patch).eq("id", tarefaId)
        if (error) { toast.error("Erro ao salvar"); return }
        await load()
    }

    async function salvarTitulo() {
        if (!tarefa || !titulo.trim() || titulo === tarefa.titulo) return
        await atualizar({ titulo: titulo.trim() })
    }

    async function salvarDescricao() {
        if (!tarefa || descricao === (tarefa.descricao ?? "")) return
        await atualizar({ descricao: descricao || null })
    }

    async function alterarColaboradores(ids: string[]) {
        const adicionar = ids.filter((id) => !colaboradores.includes(id))
        const remover = colaboradores.filter((id) => !ids.includes(id))
        if (adicionar.length) {
            await supabase.from("somos_preta_tarefa_colaboradores").insert(adicionar.map((profile_id) => ({ tarefa_id: tarefaId, profile_id })))
        }
        for (const profile_id of remover) {
            await supabase.from("somos_preta_tarefa_colaboradores").delete().eq("tarefa_id", tarefaId).eq("profile_id", profile_id)
        }
        await load()
    }

    function pedirConclusao() {
        setConcluirOpen(true)
    }

    async function confirmarConclusao(observacao: string) {
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from("somos_preta_tarefas").update({
            status: "concluida",
            concluida_em: new Date().toISOString(),
        }).eq("id", tarefaId)
        if (observacao.trim()) {
            await supabase.from("somos_preta_tarefa_comentarios").insert({
                tarefa_id: tarefaId, autor_id: user?.id ?? null, conteudo: observacao.trim(), tipo: "atualizacao",
            })
        }
        toast.success("Tarefa concluída")
        await load()
    }

    async function reabrir() {
        await atualizar({ status: "a_fazer", concluida_em: null })
    }

    async function mudarStatus(status: TarefaStatus) {
        if (status === "concluida") { pedirConclusao(); return }
        await atualizar({ status, concluida_em: null })
    }

    async function excluir() {
        const { error } = await supabase.from("somos_preta_tarefas").delete().eq("id", tarefaId)
        if (error) { toast.error("Erro ao excluir"); return }
        toast.success("Tarefa excluída")
        router.push("/app/tarefas")
    }

    if (loading) {
        return <div className="flex items-center justify-center py-24 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
    }

    if (!tarefa) {
        return (
            <Card><CardContent className="py-14 text-center text-muted-foreground">
                <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Tarefa não encontrada</p>
                <Link href="/app/tarefas" className="text-primary text-sm hover:underline">Voltar para Tarefas</Link>
            </CardContent></Card>
        )
    }

    const prazo = tarefaPrazoBadge(tarefa)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-2">
                <Link href="/app/tarefas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
                    <ArrowLeft className="h-4 w-4" /> Tarefas
                </Link>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-600">
                            <Trash2 className="h-4 w-4" /> Excluir
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={excluir} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <ConcluirDialog
                tarefaId={tarefaId}
                obrigatoria={tarefa.evidencia_obrigatoria}
                open={concluirOpen}
                onOpenChange={setConcluirOpen}
                onConfirmar={confirmarConclusao}
            />

            <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
                <div className="space-y-6 min-w-0">
                    <div className="flex items-start gap-3">
                        <Checkbox
                            checked={tarefa.status === "concluida"}
                            onCheckedChange={(v) => (v === true ? pedirConclusao() : reabrir())}
                            className="mt-1.5 h-5 w-5"
                            aria-label="Marcar como concluída"
                        />
                        <Input
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            onBlur={salvarTitulo}
                            className={`text-xl font-bold border-none px-0 h-auto shadow-none focus-visible:ring-0 ${tarefa.status === "concluida" ? "line-through text-muted-foreground" : ""}`}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge className={TAREFA_STATUS[tarefa.status].className} variant="secondary">{TAREFA_STATUS[tarefa.status].label}</Badge>
                        <span className={`text-sm font-medium ${TAREFA_PRIORIDADE[tarefa.prioridade].className}`}>{TAREFA_PRIORIDADE[tarefa.prioridade].label}</span>
                        {prazo && <Badge className={prazo.className} variant="secondary">{prazo.label}</Badge>}
                        {tarefa.evidencia_obrigatoria && <Badge variant="outline" className="text-muted-foreground">Evidência obrigatória</Badge>}
                    </div>

                    <Tabs defaultValue="detalhes">
                        <TabsList>
                            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                            <TabsTrigger value="subtarefas">Subtarefas</TabsTrigger>
                            <TabsTrigger value="anexos"><Paperclip className="h-3.5 w-3.5" /> Anexos</TabsTrigger>
                            <TabsTrigger value="atualizacoes">Atualizações</TabsTrigger>
                            <TabsTrigger value="historico"><History className="h-3.5 w-3.5" /> Histórico</TabsTrigger>
                        </TabsList>

                        <TabsContent value="detalhes" className="space-y-1.5">
                            <Label>Descrição</Label>
                            <Textarea
                                rows={5}
                                placeholder="Sem descrição"
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                onBlur={salvarDescricao}
                            />
                        </TabsContent>

                        <TabsContent value="subtarefas">
                            <SubtarefasSection tarefaId={tarefaId} />
                        </TabsContent>

                        <TabsContent value="anexos">
                            <AnexosSection tarefaId={tarefaId} />
                        </TabsContent>

                        <TabsContent value="atualizacoes">
                            <ComentariosSection tarefaId={tarefaId} />
                        </TabsContent>

                        <TabsContent value="historico">
                            <Timeline eventos={eventos} profiles={profiles} />
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Status</Label>
                                <Select value={tarefa.status} onValueChange={(v) => mudarStatus(v as TarefaStatus)}>
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>{TAREFA_STATUS_ORDEM.map((s) => <SelectItem key={s} value={s}>{TAREFA_STATUS[s].label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Prioridade</Label>
                                <Select value={tarefa.prioridade} onValueChange={(v) => atualizar({ prioridade: v as TarefaPrioridade })}>
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>{Object.entries(TAREFA_PRIORIDADE).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Solicitante</Label>
                                <UserPicker value={tarefa.solicitante_id} onChange={(v) => atualizar({ solicitante_id: v })} placeholder="Quem solicitou" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Responsável principal</Label>
                                <UserPicker value={tarefa.responsavel} onChange={(v) => atualizar({ responsavel: v })} placeholder="Quem responde" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Colaboradores</Label>
                                <UserMultiPicker values={colaboradores} onChange={alterarColaboradores} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Início</Label>
                                    <Input type="date" value={tarefa.data_inicio ?? ""} onChange={(e) => atualizar({ data_inicio: e.target.value || null })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Prazo</Label>
                                    <Input type="date" value={tarefa.data_entrega ?? ""} onChange={(e) => atualizar({ data_entrega: e.target.value || null })} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Horário</Label>
                                <Input type="time" value={tarefa.horario ?? ""} onChange={(e) => atualizar({ horario: e.target.value || null })} />
                            </div>
                            <div className="flex items-center justify-between pt-1">
                                <Label htmlFor="evid-obrig" className="text-xs text-muted-foreground">Exigir evidência para concluir</Label>
                                <Checkbox
                                    id="evid-obrig"
                                    checked={tarefa.evidencia_obrigatoria}
                                    onCheckedChange={(v) => atualizar({ evidencia_obrigatoria: v === true })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-sm">Vínculos</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {tarefa.campanha?.cliente && (
                                <Link href={`/app/clientes/${tarefa.campanha.cliente.id}`} className="flex items-center gap-2 hover:text-primary">
                                    <Building2 className="h-4 w-4 text-muted-foreground" /> {tarefa.campanha.cliente.nome}
                                </Link>
                            )}
                            {tarefa.campanha && (
                                <Link href={`/app/campanhas/${tarefa.campanha.id}`} className="flex items-center gap-2 hover:text-primary">
                                    <Megaphone className="h-4 w-4 text-muted-foreground" /> {tarefa.campanha.nome}
                                </Link>
                            )}
                            {tarefa.influencer && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="h-4 w-4" /> {tarefa.influencer.nome}
                                </div>
                            )}
                            {!tarefa.campanha?.cliente && !tarefa.campanha && !tarefa.influencer && (
                                <p className="text-muted-foreground">Sem vínculos.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
