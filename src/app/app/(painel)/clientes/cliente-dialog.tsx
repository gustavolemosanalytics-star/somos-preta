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
import { CLIENTE_STATUS, CLIENTE_STATUS_ORDEM } from "@/lib/constants/campanhas"
import { SEGMENTOS, SEGMENTO_OUTRO } from "@/lib/constants/segmentos"
import { UFS } from "@/lib/constants/uf"
import { createClient } from "@/lib/supabase/client"
import type { ClienteStatus, Profile } from "@/lib/db/types"
import type { ClienteDaLista } from "./tipos"

const SEM_VALOR = "__nenhum__"

type Formulario = {
    nome: string
    empresa: string
    segmento: string
    segmentoOutro: string
    cidade: string
    estado: string
    site: string
    email: string
    telefone: string
    status: ClienteStatus
    responsavel_id: string
    contato_nome: string
    contato_cargo: string
    observacoes: string
}

const VAZIO: Formulario = {
    nome: "", empresa: "", segmento: "", segmentoOutro: "", cidade: "", estado: "",
    site: "", email: "", telefone: "", status: "ativo", responsavel_id: SEM_VALOR,
    contato_nome: "", contato_cargo: "", observacoes: "",
}

/**
 * Estado inicial a partir do cliente.
 *
 * Roda no inicializador do useState, não num efeito: sincronizar props para
 * estado dentro de useEffect provoca uma renderização em cascata a cada
 * abertura. Quem garante que o formulário nasce do zero é a `key` que o pai
 * passa neste componente.
 */
function inicial(cliente: ClienteDaLista | null): Formulario {
    if (!cliente) return VAZIO

    // Segmento fora da lista é texto livre antigo: vai para "Outro" com o valor
    // preservado, senão editar o cliente apagaria o que estava lá.
    const conhecido = SEGMENTOS.includes(cliente.segmento as never)
    return {
        nome: cliente.nome,
        empresa: cliente.empresa ?? "",
        segmento: cliente.segmento ? (conhecido ? cliente.segmento : SEGMENTO_OUTRO) : "",
        segmentoOutro: cliente.segmento && !conhecido ? cliente.segmento : "",
        cidade: cliente.cidade ?? "",
        estado: cliente.estado ?? "",
        site: cliente.site ?? "",
        email: cliente.email ?? "",
        telefone: cliente.telefone ?? "",
        status: cliente.status,
        responsavel_id: cliente.responsavel_id ?? SEM_VALOR,
        contato_nome: cliente.contato_nome ?? "",
        contato_cargo: cliente.contato_cargo ?? "",
        observacoes: cliente.observacoes ?? "",
    }
}

/** Criação e edição no mesmo diálogo — os campos são os mesmos. */
export function ClienteDialog({ cliente, aberto, onOpenChange, profiles, onSalvo }: {
    cliente: ClienteDaLista | null
    aberto: boolean
    onOpenChange: (v: boolean) => void
    profiles: Profile[]
    onSalvo: () => void
}) {
    const [supabase] = useState(() => createClient())
    const [form, setForm] = useState<Formulario>(() => inicial(cliente))
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    function campos() {
        const segmento = form.segmento === SEGMENTO_OUTRO ? form.segmentoOutro.trim() : form.segmento
        return {
            nome: form.nome.trim(),
            empresa: form.empresa.trim() || null,
            segmento: segmento || null,
            cidade: form.cidade.trim() || null,
            estado: form.estado || null,
            site: form.site.trim() || null,
            email: form.email.trim() || null,
            telefone: form.telefone.trim() || null,
            status: form.status,
            responsavel_id: form.responsavel_id === SEM_VALOR ? null : form.responsavel_id,
            contato_nome: form.contato_nome.trim() || null,
            contato_cargo: form.contato_cargo.trim() || null,
            observacoes: form.observacoes.trim() || null,
        }
    }

    async function salvar(e: React.FormEvent) {
        e.preventDefault()
        if (!form.nome.trim()) { setErro("Informe o nome do cliente."); return }

        setErro(null)
        setSalvando(true)

        if (cliente) {
            // .select("id") porque update barrado pela RLS não devolve erro —
            // devolve zero linhas, e a tela diria "salvo" para nada.
            const { data, error } = await supabase
                .from("somos_preta_clientes")
                .update(campos())
                .eq("id", cliente.id)
                .select("id")
            setSalvando(false)
            if (error || !data?.length) { toast.error("Não foi possível salvar"); return }
            toast.success("Cliente atualizado")
        } else {
            const { data: { user } } = await supabase.auth.getUser()
            const { error } = await supabase
                .from("somos_preta_clientes")
                .insert({ ...campos(), created_by: user?.id ?? null })
            setSalvando(false)
            if (error) { toast.error("Não foi possível cadastrar"); return }
            toast.success("Cliente cadastrado")
        }

        onSalvo()
    }

    return (
        <Dialog open={aberto} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={salvar}>
                    <DialogHeader>
                        <DialogTitle>{cliente ? "Editar cliente" : "Novo cliente"}</DialogTitle>
                        <DialogDescription>
                            Cadastre a marca ou conta atendida. Campanhas e tarefas se penduram nela.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="nome">Nome *</Label>
                                <Input
                                    id="nome" value={form.nome}
                                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                                    aria-invalid={!!erro && !form.nome.trim()} required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="empresa">Marca</Label>
                                <Input
                                    id="empresa" value={form.empresa}
                                    onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="segmento">Segmento</Label>
                                <DropdownSelect
                                    id="segmento"
                                    value={form.segmento}
                                    onValueChange={(v) => setForm({ ...form, segmento: v })}
                                    options={SEGMENTOS.map((s) => ({ value: s, label: s }))}
                                    placeholder="Selecione"
                                />
                            </div>
                            {form.segmento === SEGMENTO_OUTRO ? (
                                <div className="grid gap-2">
                                    <Label htmlFor="segmento-outro">Qual segmento?</Label>
                                    <Input
                                        id="segmento-outro" value={form.segmentoOutro}
                                        onChange={(e) => setForm({ ...form, segmentoOutro: e.target.value })}
                                    />
                                </div>
                            ) : (
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <DropdownSelect
                                        id="status"
                                        value={form.status}
                                        onValueChange={(v) => setForm({ ...form, status: v as ClienteStatus })}
                                        options={CLIENTE_STATUS_ORDEM.map((s) => ({ value: s, label: CLIENTE_STATUS[s].label }))}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="cidade">Cidade</Label>
                                <Input
                                    id="cidade" value={form.cidade}
                                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="estado">UF</Label>
                                <DropdownSelect
                                    id="estado"
                                    value={form.estado}
                                    onValueChange={(v) => setForm({ ...form, estado: v })}
                                    options={UFS.map((u) => ({ value: u.sigla, label: u.sigla }))}
                                    placeholder="UF"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="site">Site</Label>
                            <Input
                                id="site" type="url" placeholder="https://..."
                                value={form.site}
                                onChange={(e) => setForm({ ...form, site: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="responsavel">Responsável pela conta</Label>
                            <DropdownSelect
                                id="responsavel"
                                value={form.responsavel_id}
                                onValueChange={(v) => setForm({ ...form, responsavel_id: v })}
                                options={[
                                    { value: SEM_VALOR, label: "Sem responsável" },
                                    ...profiles.map((p) => ({ value: p.id, label: p.nome ?? p.email ?? p.id })),
                                ]}
                            />
                        </div>

                        <fieldset className="grid gap-4 rounded-xl border p-3 sm:grid-cols-2">
                            <legend className="px-1 text-xs uppercase tracking-wider text-muted-foreground">
                                Pessoa de contato
                            </legend>
                            <div className="grid gap-2">
                                <Label htmlFor="contato-nome">Nome</Label>
                                <Input
                                    id="contato-nome" value={form.contato_nome}
                                    onChange={(e) => setForm({ ...form, contato_nome: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="contato-cargo">Cargo</Label>
                                <Input
                                    id="contato-cargo" placeholder="Account Manager"
                                    value={form.contato_cargo}
                                    onChange={(e) => setForm({ ...form, contato_cargo: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input
                                    id="email" type="email" value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="telefone">Telefone</Label>
                                <Input
                                    id="telefone" value={form.telefone}
                                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                                />
                            </div>
                        </fieldset>

                        <div className="grid gap-2">
                            <Label htmlFor="observacoes">Descrição</Label>
                            <Textarea
                                id="observacoes" value={form.observacoes}
                                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                                placeholder="O que esta conta é, em duas linhas."
                            />
                        </div>

                        {erro && <p className="text-xs text-destructive">{erro}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={salvando} className="rounded-xl">
                            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : cliente ? "Salvar alterações" : "Cadastrar cliente"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
