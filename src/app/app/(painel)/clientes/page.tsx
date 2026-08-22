"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Cliente } from "@/lib/db/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Building2, Plus, Loader2, Search, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { UFS } from "@/lib/constants/uf"
import { SEGMENTOS, SEGMENTO_OUTRO } from "@/lib/constants/segmentos"

type ClienteFormState = {
    nome: string
    empresa: string
    email: string
    telefone: string
    segmento: string
    segmentoOutro: string
    cidade: string
    estado: string
    observacoes: string
}

/** Resolve o valor final de `segmento` a ser salvo: quando "Outro" está
 *  selecionado, usa o texto livre digitado em vez do literal "Outro". */
function resolveSegmento(form: Pick<ClienteFormState, "segmento" | "segmentoOutro">) {
    return form.segmento === SEGMENTO_OUTRO ? form.segmentoOutro.trim() : form.segmento
}

/** Reconstrói o estado do Select de segmento a partir de um valor salvo no
 *  banco: se bater com uma opção padrão, seleciona ela; caso contrário,
 *  cai em "Outro" com o valor original preenchido no campo livre. */
function deriveSegmentoState(segmento: string | null): Pick<ClienteFormState, "segmento" | "segmentoOutro"> {
    if (!segmento) return { segmento: "", segmentoOutro: "" }
    if ((SEGMENTOS as readonly string[]).includes(segmento) && segmento !== SEGMENTO_OUTRO) {
        return { segmento, segmentoOutro: "" }
    }
    return { segmento: SEGMENTO_OUTRO, segmentoOutro: segmento }
}

function validarCliente(form: Pick<ClienteFormState, "nome" | "empresa" | "segmento" | "segmentoOutro">) {
    const errors: Record<string, string> = {}
    if (!form.nome.trim()) errors.nome = "Informe o nome do cliente"
    if (!form.empresa.trim()) errors.empresa = "Informe a empresa/marca"
    if (!resolveSegmento(form)) errors.segmento = "Selecione o segmento"
    return errors
}

export default function ClientesPage() {
    const [supabase] = useState(() => createClient())
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [loading, setLoading] = useState(true)
    const [busca, setBusca] = useState("")
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState<ClienteFormState>({
        nome: "",
        empresa: "",
        email: "",
        telefone: "",
        segmento: "",
        segmentoOutro: "",
        cidade: "",
        estado: "",
        observacoes: "",
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    function updateField<K extends keyof ClienteFormState>(key: K, value: ClienteFormState[K]) {
        setForm((f) => ({ ...f, [key]: value }))
        setErrors((er) => (er[key] ? { ...er, [key]: "" } : er))
    }

    async function load() {
        setLoading(true)
        const { data, error } = await supabase
            .from("somos_preta_clientes")
            .select("*")
            .order("created_at", { ascending: false })
        if (error) toast.error("Erro ao carregar clientes")
        setClientes((data as Cliente[]) ?? [])
        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const filtrados = useMemo(() => {
        const q = busca.trim().toLowerCase()
        if (!q) return clientes
        return clientes.filter(
            (c) =>
                c.nome.toLowerCase().includes(q) ||
                (c.empresa ?? "").toLowerCase().includes(q) ||
                (c.segmento ?? "").toLowerCase().includes(q)
        )
    }, [clientes, busca])

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        const validation = validarCliente(form)
        setErrors(validation)
        if (Object.keys(validation).length > 0) return
        setSaving(true)

        const {
            data: { user },
        } = await supabase.auth.getUser()

        const { error } = await supabase.from("somos_preta_clientes").insert({
            nome: form.nome.trim(),
            empresa: form.empresa.trim(),
            email: form.email || null,
            telefone: form.telefone || null,
            segmento: resolveSegmento(form),
            cidade: form.cidade || null,
            estado: form.estado || null,
            observacoes: form.observacoes || null,
            created_by: user?.id ?? null,
        })

        setSaving(false)
        if (error) {
            toast.error("Não foi possível salvar o cliente")
            return
        }
        toast.success("Cliente cadastrado")
        setOpen(false)
        setForm({ nome: "", empresa: "", email: "", telefone: "", segmento: "", segmentoOutro: "", cidade: "", estado: "", observacoes: "" })
        setErrors({})
        load()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-primary" />
                        Clientes
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        As marcas e contas atendidas. Cada cliente reúne suas campanhas.
                    </p>
                </div>

                <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setErrors({}) }}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl">
                            <Plus className="h-4 w-4" /> Novo cliente
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>Novo cliente</DialogTitle>
                                <DialogDescription>Cadastre a marca/conta atendida.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="nome">Nome *</Label>
                                    <Input id="nome" value={form.nome} onChange={(e) => updateField("nome", e.target.value)} aria-invalid={!!errors.nome} />
                                    {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="empresa">Empresa/Marca *</Label>
                                        <Input id="empresa" value={form.empresa} onChange={(e) => updateField("empresa", e.target.value)} aria-invalid={!!errors.empresa} />
                                        {errors.empresa && <p className="text-xs text-destructive">{errors.empresa}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="segmento">Segmento *</Label>
                                        <Select value={form.segmento} onValueChange={(v) => updateField("segmento", v)}>
                                            <SelectTrigger id="segmento" className="w-full" aria-invalid={!!errors.segmento}>
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SEGMENTOS.map((s) => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.segmento === SEGMENTO_OUTRO && (
                                            <Input
                                                placeholder="Qual segmento?"
                                                value={form.segmentoOutro}
                                                onChange={(e) => updateField("segmentoOutro", e.target.value)}
                                                aria-invalid={!!errors.segmento}
                                            />
                                        )}
                                        {errors.segmento && <p className="text-xs text-destructive">{errors.segmento}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="telefone">Telefone</Label>
                                        <Input id="telefone" value={form.telefone} onChange={(e) => updateField("telefone", e.target.value)} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="cidade">Cidade</Label>
                                        <Input id="cidade" value={form.cidade} onChange={(e) => updateField("cidade", e.target.value)} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="estado">Estado (UF)</Label>
                                        <Select value={form.estado} onValueChange={(v) => updateField("estado", v)}>
                                            <SelectTrigger id="estado" className="w-full">
                                                <SelectValue placeholder="UF" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {UFS.map((uf) => (
                                                    <SelectItem key={uf.sigla} value={uf.sigla}>{uf.nome} ({uf.sigla})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="obs">Observações</Label>
                                    <Textarea id="obs" value={form.observacoes} onChange={(e) => updateField("observacoes", e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={saving} className="rounded-xl">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar cliente"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar cliente..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-9 rounded-xl"
                />
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
                        </div>
                    ) : filtrados.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
                            <p className="font-medium">Nenhum cliente ainda</p>
                            <p className="text-sm text-muted-foreground">Clique em “Novo cliente” para começar.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead className="hidden sm:table-cell">Empresa</TableHead>
                                    <TableHead className="hidden md:table-cell">Segmento</TableHead>
                                    <TableHead className="hidden lg:table-cell">Local</TableHead>
                                    <TableHead className="text-right">Campanhas</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtrados.map((c) => (
                                    <TableRow key={c.id} className="cursor-pointer">
                                        <TableCell className="font-medium">
                                            <Link href={`/app/clientes/${c.id}`} className="hover:text-primary">
                                                {c.nome}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell text-muted-foreground">{c.empresa ?? "—"}</TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground">{c.segmento ?? "—"}</TableCell>
                                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                                            {[c.cidade, c.estado].filter(Boolean).join(" / ") || "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/app/clientes/${c.id}`} className="text-primary text-sm hover:underline">
                                                ver
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <ClienteRowActions cliente={c} supabase={supabase} onDone={load} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function ClienteRowActions({
    cliente,
    supabase,
    onDone,
}: {
    cliente: Cliente
    supabase: ReturnType<typeof createClient>
    onDone: () => void
}) {
    const [openEdit, setOpenEdit] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const segmentoInicial = deriveSegmentoState(cliente.segmento)
    const [form, setForm] = useState<ClienteFormState>({
        nome: cliente.nome ?? "",
        empresa: cliente.empresa ?? "",
        email: cliente.email ?? "",
        telefone: cliente.telefone ?? "",
        segmento: segmentoInicial.segmento,
        segmentoOutro: segmentoInicial.segmentoOutro,
        cidade: cliente.cidade ?? "",
        estado: cliente.estado ?? "",
        observacoes: cliente.observacoes ?? "",
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    function updateField<K extends keyof ClienteFormState>(key: K, value: ClienteFormState[K]) {
        setForm((f) => ({ ...f, [key]: value }))
        setErrors((er) => (er[key] ? { ...er, [key]: "" } : er))
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault()
        const validation = validarCliente(form)
        setErrors(validation)
        if (Object.keys(validation).length > 0) return
        setSaving(true)

        const { error } = await supabase
            .from("somos_preta_clientes")
            .update({
                nome: form.nome.trim(),
                empresa: form.empresa.trim(),
                email: form.email || null,
                telefone: form.telefone || null,
                segmento: resolveSegmento(form),
                cidade: form.cidade || null,
                estado: form.estado || null,
                observacoes: form.observacoes || null,
            })
            .eq("id", cliente.id)

        setSaving(false)
        if (error) {
            toast.error("Não foi possível atualizar o cliente")
            return
        }
        toast.success("Cliente atualizado")
        setOpenEdit(false)
        onDone()
    }

    async function handleDelete() {
        setDeleting(true)
        const { error } = await supabase
            .from("somos_preta_clientes")
            .delete()
            .eq("id", cliente.id)
        setDeleting(false)
        if (error) {
            toast.error("Não foi possível excluir o cliente")
            return
        }
        toast.success("Cliente excluído")
        onDone()
    }

    return (
        <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
        >
            <Dialog open={openEdit} onOpenChange={(o) => { setOpenEdit(o); if (!o) setErrors({}) }}>
                <DialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-xl text-muted-foreground hover:text-foreground"
                        title="Editar"
                        aria-label="Editar cliente"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                    <form onSubmit={handleUpdate}>
                        <DialogHeader>
                            <DialogTitle>Editar cliente</DialogTitle>
                            <DialogDescription>Atualize os dados da marca/conta atendida.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor={`edit-nome-${cliente.id}`}>Nome *</Label>
                                <Input id={`edit-nome-${cliente.id}`} value={form.nome} onChange={(e) => updateField("nome", e.target.value)} aria-invalid={!!errors.nome} />
                                {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor={`edit-empresa-${cliente.id}`}>Empresa/Marca *</Label>
                                    <Input id={`edit-empresa-${cliente.id}`} value={form.empresa} onChange={(e) => updateField("empresa", e.target.value)} aria-invalid={!!errors.empresa} />
                                    {errors.empresa && <p className="text-xs text-destructive">{errors.empresa}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor={`edit-segmento-${cliente.id}`}>Segmento *</Label>
                                    <Select value={form.segmento} onValueChange={(v) => updateField("segmento", v)}>
                                        <SelectTrigger id={`edit-segmento-${cliente.id}`} className="w-full" aria-invalid={!!errors.segmento}>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SEGMENTOS.map((s) => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.segmento === SEGMENTO_OUTRO && (
                                        <Input
                                            placeholder="Qual segmento?"
                                            value={form.segmentoOutro}
                                            onChange={(e) => updateField("segmentoOutro", e.target.value)}
                                            aria-invalid={!!errors.segmento}
                                        />
                                    )}
                                    {errors.segmento && <p className="text-xs text-destructive">{errors.segmento}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor={`edit-email-${cliente.id}`}>Email</Label>
                                    <Input id={`edit-email-${cliente.id}`} type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor={`edit-telefone-${cliente.id}`}>Telefone</Label>
                                    <Input id={`edit-telefone-${cliente.id}`} value={form.telefone} onChange={(e) => updateField("telefone", e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor={`edit-cidade-${cliente.id}`}>Cidade</Label>
                                    <Input id={`edit-cidade-${cliente.id}`} value={form.cidade} onChange={(e) => updateField("cidade", e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor={`edit-estado-${cliente.id}`}>Estado (UF)</Label>
                                    <Select value={form.estado} onValueChange={(v) => updateField("estado", v)}>
                                        <SelectTrigger id={`edit-estado-${cliente.id}`} className="w-full">
                                            <SelectValue placeholder="UF" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {UFS.map((uf) => (
                                                <SelectItem key={uf.sigla} value={uf.sigla}>{uf.nome} ({uf.sigla})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`edit-obs-${cliente.id}`}>Observações</Label>
                                <Textarea id={`edit-obs-${cliente.id}`} value={form.observacoes} onChange={(e) => updateField("observacoes", e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={saving} className="rounded-xl">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar alterações"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-xl text-muted-foreground hover:text-destructive"
                        title="Excluir"
                        aria-label="Excluir cliente"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border border-border/60 rounded-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                        <AlertDialogDescription>
                            As campanhas vinculadas também serão removidas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl" disabled={deleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
                            disabled={deleting}
                            onClick={(e) => {
                                e.preventDefault()
                                handleDelete()
                            }}
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
