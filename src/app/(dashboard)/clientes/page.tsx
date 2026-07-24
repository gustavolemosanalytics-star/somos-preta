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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Building2, Plus, Loader2, Search } from "lucide-react"
import { toast } from "sonner"

export default function ClientesPage() {
    const [supabase] = useState(() => createClient())
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [loading, setLoading] = useState(true)
    const [busca, setBusca] = useState("")
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        nome: "",
        empresa: "",
        email: "",
        telefone: "",
        segmento: "",
        cidade: "",
        estado: "",
        observacoes: "",
    })

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
        if (!form.nome.trim()) return
        setSaving(true)

        const {
            data: { user },
        } = await supabase.auth.getUser()

        const { error } = await supabase.from("somos_preta_clientes").insert({
            nome: form.nome.trim(),
            empresa: form.empresa || null,
            email: form.email || null,
            telefone: form.telefone || null,
            segmento: form.segmento || null,
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
        setForm({ nome: "", empresa: "", email: "", telefone: "", segmento: "", cidade: "", estado: "", observacoes: "" })
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

                <Dialog open={open} onOpenChange={setOpen}>
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
                                    <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="empresa">Empresa</Label>
                                        <Input id="empresa" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="segmento">Segmento</Label>
                                        <Input id="segmento" value={form.segmento} onChange={(e) => setForm({ ...form, segmento: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="telefone">Telefone</Label>
                                        <Input id="telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="cidade">Cidade</Label>
                                        <Input id="cidade" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="estado">Estado (UF)</Label>
                                        <Input id="estado" maxLength={2} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="obs">Observações</Label>
                                    <Textarea id="obs" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
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
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtrados.map((c) => (
                                    <TableRow key={c.id} className="cursor-pointer">
                                        <TableCell className="font-medium">
                                            <Link href={`/clientes/${c.id}`} className="hover:text-primary">
                                                {c.nome}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell text-muted-foreground">{c.empresa ?? "—"}</TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground">{c.segmento ?? "—"}</TableCell>
                                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                                            {[c.cidade, c.estado].filter(Boolean).join(" / ") || "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/clientes/${c.id}`} className="text-primary text-sm hover:underline">
                                                ver
                                            </Link>
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
