"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { DropdownSelect } from "@/components/ui/dropdown-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UserPicker } from "@/components/tarefas/user-picker"
import {
    TAREFA_PRIORIDADE, TAREFA_STATUS, TAREFA_STATUS_ORDEM,
} from "@/lib/constants/tarefas"
import { createClient } from "@/lib/supabase/client"
import type { Area, TarefaPrioridade, TarefaStatus } from "@/lib/db/types"
import type { TarefaDaLista } from "./tipos"

const SEM_VALOR = "__nenhum__"
const PRIORIDADES: TarefaPrioridade[] = ["baixa", "media", "alta", "urgente"]

type Formulario = {
    campanha_id: string
    titulo: string
    descricao: string
    status: TarefaStatus
    prioridade: TarefaPrioridade
    area_id: string
    responsavel: string | null
    data_entrega: string
    horario: string
    duracao_minutos: string
}

function inicial(t: TarefaDaLista | null, statusInicial?: TarefaStatus): Formulario {
    if (!t) {
        return {
            campanha_id: "", titulo: "", descricao: "",
            status: statusInicial ?? "backlog", prioridade: "media",
            area_id: SEM_VALOR, responsavel: null,
            data_entrega: "", horario: "", duracao_minutos: "60",
        }
    }
    return {
        campanha_id: t.campanha_id,
        titulo: t.titulo,
        descricao: t.descricao ?? "",
        status: statusInicial ?? t.status,
        prioridade: t.prioridade,
        area_id: t.area_id ?? SEM_VALOR,
        responsavel: t.responsavel,
        data_entrega: t.data_entrega ?? "",
        horario: t.horario?.slice(0, 5) ?? "",
        duracao_minutos: String(t.duracao_minutos ?? 60),
    }
}

export function TarefaDialog({
    tarefa, statusInicial, aberto, onOpenChange, campanhas, areas, onSalvo,
}: {
    tarefa: TarefaDaLista | null
    statusInicial?: TarefaStatus
    aberto: boolean
    onOpenChange: (v: boolean) => void
    campanhas: { id: string; nome: string }[]
    areas: Area[]
    onSalvo: () => void
}) {
    const [supabase] = useState(() => createClient())
    const [form, setForm] = useState<Formulario>(() => inicial(tarefa, statusInicial))
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    function campos() {
        return {
            campanha_id: form.campanha_id,
            titulo: form.titulo.trim(),
            descricao: form.descricao.trim() || null,
            status: form.status,
            prioridade: form.prioridade,
            area_id: form.area_id === SEM_VALOR ? null : form.area_id,
            responsavel: form.responsavel,
            data_entrega: form.data_entrega || null,
            horario: form.horario || null,
            duracao_minutos: Number(form.duracao_minutos) || 60,
        }
    }

    async function salvar(e: React.FormEvent) {
        e.preventDefault()
        if (!form.titulo.trim()) { setErro("Informe o título da tarefa."); return }
        if (!form.campanha_id) { setErro("Toda tarefa pertence a uma campanha — escolha uma."); return }
        // Evidência obrigatória só se resolve na página da tarefa, onde o anexo
        // é enviado; concluir por aqui burlaria a regra.
        if (form.status === "concluida" && tarefa?.evidencia_obrigatoria) {
            setErro("Esta tarefa exige evidência de conclusão. Conclua pela página dela.")
            return
        }

        setErro(null)
        setSalvando(true)

        if (tarefa) {
            const { data, error } = await supabase
                .from("somos_preta_tarefas")
                .update({
                    ...campos(),
                    concluida_em: form.status === "concluida"
                        ? (tarefa.concluida_em ?? new Date().toISOString())
                        : null,
                })
                .eq("id", tarefa.id)
                .select("id")
            setSalvando(false)
            if (error || !data?.length) { toast.error("Não foi possível salvar"); return }
            toast.success("Tarefa atualizada")
        } else {
            const { data: { user } } = await supabase.auth.getUser()
            const { error } = await supabase.from("somos_preta_tarefas").insert({
                ...campos(),
                concluida_em: form.status === "concluida" ? new Date().toISOString() : null,
                created_by: user?.id ?? null,
            })
            setSalvando(false)
            if (error) { toast.error("Não foi possível criar a tarefa"); return }
            toast.success("Tarefa criada")
        }

        onSalvo()
    }

    return (
        <Dialog open={aberto} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={salvar}>
                    <DialogHeader>
                        <DialogTitle>{tarefa ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
                        <DialogDescription>
                            Defina responsabilidade, prazo e prioridade. A hora posiciona a tarefa no calendário.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="titulo">Título *</Label>
                            <Input
                                id="titulo" value={form.titulo}
                                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                                aria-invalid={!!erro && !form.titulo.trim()} required
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="campanha">Campanha *</Label>
                                <DropdownSelect
                                    id="campanha"
                                    value={form.campanha_id}
                                    onValueChange={(v) => setForm({ ...form, campanha_id: v })}
                                    options={campanhas.map((c) => ({ value: c.id, label: c.nome }))}
                                    placeholder="Selecione"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="area">Área</Label>
                                <DropdownSelect
                                    id="area"
                                    value={form.area_id}
                                    onValueChange={(v) => setForm({ ...form, area_id: v })}
                                    options={[
                                        { value: SEM_VALOR, label: "Sem área" },
                                        ...areas.map((a) => ({ value: a.id, label: a.nome })),
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="descricao">Descrição</Label>
                            <Textarea
                                id="descricao" value={form.descricao}
                                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <DropdownSelect
                                    id="status"
                                    value={form.status}
                                    onValueChange={(v) => setForm({ ...form, status: v as TarefaStatus })}
                                    options={TAREFA_STATUS_ORDEM.map((s) => ({ value: s, label: TAREFA_STATUS[s].label }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="prioridade">Prioridade</Label>
                                <DropdownSelect
                                    id="prioridade"
                                    value={form.prioridade}
                                    onValueChange={(v) => setForm({ ...form, prioridade: v as TarefaPrioridade })}
                                    options={PRIORIDADES.map((p) => ({ value: p, label: TAREFA_PRIORIDADE[p].label }))}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Responsável</Label>
                            <UserPicker
                                value={form.responsavel}
                                onChange={(id) => setForm({ ...form, responsavel: id })}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor="entrega">Prazo</Label>
                                <Input
                                    id="entrega" type="date" value={form.data_entrega}
                                    onChange={(e) => setForm({ ...form, data_entrega: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="horario">Hora</Label>
                                <Input
                                    id="horario" type="time" value={form.horario}
                                    onChange={(e) => setForm({ ...form, horario: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="duracao">Duração (min)</Label>
                                <Input
                                    id="duracao" type="number" min="15" step="15"
                                    value={form.duracao_minutos}
                                    onChange={(e) => setForm({ ...form, duracao_minutos: e.target.value })}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground sm:col-span-3">
                                Sem hora, a tarefa aparece na faixa “Dia todo” do calendário.
                            </p>
                        </div>

                        {erro && <p className="text-xs text-destructive">{erro}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={salvando} className="rounded-xl">
                            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : tarefa ? "Salvar alterações" : "Criar tarefa"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
