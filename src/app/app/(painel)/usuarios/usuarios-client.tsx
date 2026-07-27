"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Profile, Role } from "@/lib/db/types"
import { criarUsuario, excluirUsuario } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { ShieldCheck, Plus, Loader2, Trash2, Search } from "lucide-react"
import { toast } from "sonner"

const ROLES: { value: Role; label: string }[] = [
    { value: "admin", label: "Administrador" },
    { value: "gestor", label: "Gestor" },
    { value: "analista", label: "Analista" },
    { value: "creator", label: "Creator" },
]
const roleLabel = (r: Role) => ROLES.find((x) => x.value === r)?.label ?? r
const roleClass: Record<Role, string> = {
    admin: "bg-primary/15 text-primary",
    gestor: "bg-blue-500/15 text-blue-600",
    analista: "bg-green-500/15 text-green-600",
    creator: "bg-muted text-muted-foreground",
}

export function UsuariosClient({ meId }: { meId: string }) {
    const [supabase] = useState(() => createClient())
    const [usuarios, setUsuarios] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [busca, setBusca] = useState("")
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ nome: "", email: "", senha: "", role: "analista" as Role })

    async function load() {
        setLoading(true)
        const { data } = await supabase
            .from("somos_preta_profiles")
            .select("*")
            .order("created_at", { ascending: false })
        setUsuarios((data as Profile[]) ?? [])
        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const filtrados = useMemo(() => {
        const q = busca.trim().toLowerCase()
        if (!q) return usuarios
        return usuarios.filter((u) => (u.nome ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q))
    }, [usuarios, busca])

    async function mudarRole(u: Profile, role: Role) {
        setUsuarios((prev) => prev.map((x) => x.id === u.id ? { ...x, role } : x))
        const { error } = await supabase.from("somos_preta_profiles").update({ role }).eq("id", u.id)
        if (error) { toast.error("Não foi possível mudar o papel"); load() }
        else toast.success(`${u.nome ?? u.email} agora é ${roleLabel(role)}`)
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!form.email.trim() || form.senha.length < 6) {
            toast.error("Informe email e senha (mín. 6 caracteres)")
            return
        }
        setSaving(true)
        const res = await criarUsuario({ ...form, email: form.email.trim() })
        setSaving(false)
        if (res.error) { toast.error(res.error); return }
        toast.success("Usuário criado")
        setOpen(false)
        setForm({ nome: "", email: "", senha: "", role: "analista" })
        load()
    }

    async function handleDelete(u: Profile) {
        const res = await excluirUsuario(u.id)
        if (res.error) { toast.error(res.error); return }
        toast.success("Usuário excluído")
        load()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-primary" /> Usuários
                    </h1>
                    <p className="text-muted-foreground text-sm">Gerencie a equipe e os papéis de acesso.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl"><Plus className="h-4 w-4" /> Novo usuário</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>Novo usuário</DialogTitle>
                                <DialogDescription>Cria o acesso e já define o papel.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="nome">Nome</Label>
                                    <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="senha">Senha *</Label>
                                    <Input id="senha" type="text" placeholder="mín. 6 caracteres" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Papel</Label>
                                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={saving} className="rounded-xl">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar usuário"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome ou email..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9 rounded-xl" />
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                                    <TableHead>Papel</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtrados.map((u) => {
                                    const isMe = u.id === meId
                                    return (
                                        <TableRow key={u.id}>
                                            <TableCell className="font-medium">
                                                {u.nome ?? "—"} {isMe && <span className="text-xs text-muted-foreground">(você)</span>}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell text-muted-foreground">{u.email ?? "—"}</TableCell>
                                            <TableCell>
                                                {isMe ? (
                                                    <Badge className={roleClass[u.role]} variant="secondary">{roleLabel(u.role)}</Badge>
                                                ) : (
                                                    <Select value={u.role} onValueChange={(v) => mudarRole(u, v as Role)}>
                                                        <SelectTrigger className="w-[150px] h-8">
                                                            <Badge className={roleClass[u.role]} variant="secondary">{roleLabel(u.role)}</Badge>
                                                        </SelectTrigger>
                                                        <SelectContent>{ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {!isMe && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Isso remove o acesso de <strong>{u.nome ?? u.email}</strong> permanentemente.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(u)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
