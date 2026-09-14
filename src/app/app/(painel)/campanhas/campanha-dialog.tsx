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
import {
    CAMPANHA_ETAPA_LABEL, CAMPANHA_ETAPA_ORDEM, CAMPANHA_STATUS, CAMPANHA_STATUS_ORDEM,
} from "@/lib/constants/campanhas"
import { TAREFA_PRIORIDADE } from "@/lib/constants/tarefas"
import { createClient } from "@/lib/supabase/client"
import type {
    CampanhaEtapa, CampanhaStatus, Cliente, Profile, TarefaPrioridade,
} from "@/lib/db/types"
import type { CampanhaDaLista } from "./tipos"

const SEM_VALOR = "__nenhum__"

const PRIORIDADES: TarefaPrioridade[] = ["baixa", "media", "alta", "urgente"]

type Formulario = {
    cliente_id: string
    nome: string
    tagline: string
    objetivo: string
    status: CampanhaStatus
    etapa: CampanhaEtapa
    responsavel: string
    prioridade: TarefaPrioridade
    orcamento_estimado: string
    orcamento_aprovado: string
    orcamento_final: string
    data_inicio: string
    data_fim: string
    capa_url: string
}

const VAZIO: Formulario = {
    cliente_id: "", nome: "", tagline: "", objetivo: "", status: "rascunho",
    etapa: "briefing", responsavel: SEM_VALOR, prioridade: "media",
    orcamento_estimado: "", orcamento_aprovado: "", orcamento_final: "",
    data_inicio: "", data_fim: "", capa_url: "",
}

const numero = (v: number | null) => (v == null ? "" : String(v))

function inicial(c: CampanhaDaLista | null): Formulario {
    if (!c) return VAZIO
    return {
        cliente_id: c.cliente_id ?? "",
        nome: c.nome,
        tagline: c.tagline ?? "",
        objetivo: c.objetivo ?? "",
        status: c.status,
        etapa: c.etapa,
        responsavel: c.responsavel ?? SEM_VALOR,
        prioridade: c.prioridade,
        // `budget` é o campo legado; quando o estimado ainda está vazio é ele
        // que carrega o número, e some da tela se não for trazido aqui.
        orcamento_estimado: numero(c.orcamento_estimado ?? (c.budget || null)),
        orcamento_aprovado: numero(c.orcamento_aprovado),
        orcamento_final: numero(c.orcamento_final),
        data_inicio: c.data_inicio ?? "",
        data_fim: c.data_fim ?? "",
        capa_url: c.capa_url ?? "",
    }
}

export function CampanhaDialog({ campanha, aberto, onOpenChange, clientes, profiles, onSalvo }: {
    campanha: CampanhaDaLista | null
    aberto: boolean
    onOpenChange: (v: boolean) => void
    clientes: Pick<Cliente, "id" | "nome">[]
    profiles: Profile[]
    onSalvo: () => void
}) {
    const [supabase] = useState(() => createClient())
    const [form, setForm] = useState<Formulario>(() => inicial(campanha))
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    function campos() {
        const dec = (v: string) => (v.trim() === "" ? null : Number(v))
        return {
            cliente_id: form.cliente_id || null,
            nome: form.nome.trim(),
            tagline: form.tagline.trim() || null,
            objetivo: form.objetivo.trim() || null,
            status: form.status,
            etapa: form.etapa,
            responsavel: form.responsavel === SEM_VALOR ? null : form.responsavel,
            prioridade: form.prioridade,
            orcamento_estimado: dec(form.orcamento_estimado),
            orcamento_aprovado: dec(form.orcamento_aprovado),
            orcamento_final: dec(form.orcamento_final),
            data_inicio: form.data_inicio || null,
            data_fim: form.data_fim || null,
            capa_url: form.capa_url.trim() || null,
        }
    }

    async function salvar(e: React.FormEvent) {
        e.preventDefault()
        if (!form.nome.trim()) { setErro("Informe o nome da campanha."); return }
        if (!form.cliente_id) { setErro("Escolha o cliente da campanha."); return }
        if (form.data_inicio && form.data_fim && form.data_fim < form.data_inicio) {
            setErro("A data final não pode ser anterior à inicial.")
            return
        }

        setErro(null)
        setSalvando(true)

        if (campanha) {
            const { data, error } = await supabase
                .from("somos_preta_campanhas")
                .update(campos())
                .eq("id", campanha.id)
                .select("id")
            setSalvando(false)
            if (error || !data?.length) { toast.error("Não foi possível salvar"); return }
            toast.success("Campanha atualizada")
        } else {
            const { data: { user } } = await supabase.auth.getUser()
            const { error } = await supabase.from("somos_preta_campanhas").insert({
                ...campos(),
                created_by: user?.id ?? null,
            })
            setSalvando(false)
            if (error) { toast.error("Não foi possível criar a campanha"); return }
            toast.success("Campanha criada")
        }

        onSalvo()
    }

    return (
        <Dialog open={aberto} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={salvar}>
                    <DialogHeader>
                        <DialogTitle>{campanha ? "Editar campanha" : "Nova campanha"}</DialogTitle>
                        <DialogDescription>
                            O status diz em que pé está o registro; a etapa, onde a entrega está.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="cliente">Cliente *</Label>
                                <DropdownSelect
                                    id="cliente"
                                    value={form.cliente_id}
                                    onValueChange={(v) => setForm({ ...form, cliente_id: v })}
                                    options={clientes.map((c) => ({ value: c.id, label: c.nome }))}
                                    placeholder="Selecione"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="nome">Nome *</Label>
                                <Input
                                    id="nome" value={form.nome}
                                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                                    aria-invalid={!!erro && !form.nome.trim()} required
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="tagline">Frase da campanha</Label>
                            <Input
                                id="tagline" placeholder="Refresca novas histórias."
                                value={form.tagline}
                                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="objetivo">Objetivo</Label>
                            <Textarea
                                id="objetivo" value={form.objetivo}
                                onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
                                placeholder="O que esta campanha precisa entregar."
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <DropdownSelect
                                    id="status"
                                    value={form.status}
                                    onValueChange={(v) => setForm({ ...form, status: v as CampanhaStatus })}
                                    options={CAMPANHA_STATUS_ORDEM.map((s) => ({ value: s, label: CAMPANHA_STATUS[s].label }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="etapa">Etapa</Label>
                                <DropdownSelect
                                    id="etapa"
                                    value={form.etapa}
                                    onValueChange={(v) => setForm({ ...form, etapa: v as CampanhaEtapa })}
                                    options={CAMPANHA_ETAPA_ORDEM.map((e) => ({ value: e, label: CAMPANHA_ETAPA_LABEL[e] }))}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="responsavel">Responsável</Label>
                                <DropdownSelect
                                    id="responsavel"
                                    value={form.responsavel}
                                    onValueChange={(v) => setForm({ ...form, responsavel: v })}
                                    options={[
                                        { value: SEM_VALOR, label: "Sem responsável" },
                                        ...profiles.map((p) => ({ value: p.id, label: p.nome ?? p.email ?? p.id })),
                                    ]}
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

                        <fieldset className="grid gap-4 rounded-xl border p-3 sm:grid-cols-3">
                            <legend className="px-1 text-xs uppercase tracking-wider text-muted-foreground">
                                Orçamento
                            </legend>
                            {([
                                ["orcamento_estimado", "Estimado"],
                                ["orcamento_aprovado", "Aprovado"],
                                ["orcamento_final", "Final"],
                            ] as const).map(([chave, label]) => (
                                <div key={chave} className="grid gap-2">
                                    <Label htmlFor={chave}>{label}</Label>
                                    <Input
                                        id={chave} type="number" min="0" step="0.01"
                                        value={form[chave]}
                                        onChange={(e) => setForm({ ...form, [chave]: e.target.value })}
                                    />
                                </div>
                            ))}
                            <p className="text-xs text-muted-foreground sm:col-span-3">
                                O card mostra o mais definitivo que estiver preenchido — final, depois
                                aprovado, depois estimado.
                            </p>
                        </fieldset>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="inicio">Início</Label>
                                <Input
                                    id="inicio" type="date" value={form.data_inicio}
                                    onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="fim">Prazo final</Label>
                                <Input
                                    id="fim" type="date" value={form.data_fim}
                                    onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="capa">Imagem de capa (URL)</Label>
                            <Input
                                id="capa" type="url" placeholder="https://..."
                                value={form.capa_url}
                                onChange={(e) => setForm({ ...form, capa_url: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Sem capa, o card usa o logo do cliente.
                            </p>
                        </div>

                        {erro && <p className="text-xs text-destructive">{erro}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={salvando} className="rounded-xl">
                            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : campanha ? "Salvar alterações" : "Criar campanha"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
