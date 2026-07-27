"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { BlogPost, BlogStatus } from "@/lib/db/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Newspaper, Plus, Loader2, Trash2, ExternalLink, Pencil } from "lucide-react"
import { toast } from "sonner"

const slugify = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "post"

export default function BlogAdminPage() {
    const [supabase] = useState(() => createClient())
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ titulo: "", categoria: "", resumo: "", conteudo: "", cover_url: "", status: "rascunho" as BlogStatus })
    const [editing, setEditing] = useState<BlogPost | null>(null)
    const [editSaving, setEditSaving] = useState(false)
    const [editForm, setEditForm] = useState({ titulo: "", categoria: "", resumo: "", conteudo: "", cover_url: "", status: "rascunho" as BlogStatus })

    async function load() {
        setLoading(true)
        const { data } = await supabase.from("somos_preta_blog_posts").select("*").order("created_at", { ascending: false })
        setPosts((data as BlogPost[]) ?? [])
        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!form.titulo.trim()) return
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        const base = slugify(form.titulo)
        let saved = false
        for (let attempt = 0; attempt < 3 && !saved; attempt++) {
            const trySlug = attempt === 0 ? base : `${base}-${Math.floor(1000 + Math.random() * 9000)}`
            const { error } = await supabase.from("somos_preta_blog_posts").insert({
                slug: trySlug,
                titulo: form.titulo.trim(),
                categoria: form.categoria || null,
                resumo: form.resumo || null,
                conteudo: form.conteudo || null,
                cover_url: form.cover_url || null,
                status: form.status,
                autor_id: user?.id ?? null,
                publicado_em: form.status === "publicado" ? new Date().toISOString() : null,
            })
            if (!error) saved = true
            else if (error.code !== "23505") { toast.error("Não foi possível salvar"); setSaving(false); return }
        }
        setSaving(false)
        if (!saved) { toast.error("Slug em uso, tente outro título"); return }
        toast.success("Post criado")
        setOpen(false)
        setForm({ titulo: "", categoria: "", resumo: "", conteudo: "", cover_url: "", status: "rascunho" })
        load()
    }

    async function togglePublish(p: BlogPost) {
        const novo: BlogStatus = p.status === "publicado" ? "rascunho" : "publicado"
        setPosts((prev) => prev.map((x) => x.id === p.id ? { ...x, status: novo } : x))
        const { error } = await supabase.from("somos_preta_blog_posts").update({
            status: novo,
            publicado_em: novo === "publicado" ? (p.publicado_em ?? new Date().toISOString()) : p.publicado_em,
        }).eq("id", p.id)
        if (error) { toast.error("Erro ao atualizar"); load() }
    }

    async function handleDelete(p: BlogPost) {
        const { error } = await supabase.from("somos_preta_blog_posts").delete().eq("id", p.id)
        if (error) { toast.error("Erro ao excluir"); return }
        toast.success("Post excluído")
        load()
    }

    function openEdit(p: BlogPost) {
        setEditForm({ titulo: p.titulo, categoria: p.categoria ?? "", resumo: p.resumo ?? "", conteudo: p.conteudo ?? "", cover_url: p.cover_url ?? "", status: p.status })
        setEditing(p)
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault()
        if (!editing || !editForm.titulo.trim()) return
        setEditSaving(true)
        const { error } = await supabase.from("somos_preta_blog_posts").update({
            titulo: editForm.titulo.trim(),
            categoria: editForm.categoria || null,
            cover_url: editForm.cover_url || null,
            resumo: editForm.resumo || null,
            conteudo: editForm.conteudo || null,
            status: editForm.status,
            publicado_em: editForm.status === "publicado" ? (editing.publicado_em ?? new Date().toISOString()) : editing.publicado_em,
        }).eq("id", editing.id)
        setEditSaving(false)
        if (error) { toast.error("Erro ao atualizar"); return }
        toast.success("Post atualizado")
        setEditing(null)
        load()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Newspaper className="h-6 w-6 text-primary" /> Blog</h1>
                    <p className="text-muted-foreground text-sm">Escreva e publique conteúdo no site.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button className="rounded-xl"><Plus className="h-4 w-4" /> Novo post</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>Novo post</DialogTitle>
                                <DialogDescription>O post fica em rascunho até você publicar.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="titulo">Título *</Label>
                                    <Input id="titulo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2"><Label htmlFor="cat">Categoria</Label><Input id="cat" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} /></div>
                                    <div className="grid gap-2"><Label htmlFor="cover">Imagem de capa (URL)</Label><Input id="cover" type="url" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} /></div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="resumo">Resumo</Label>
                                    <Textarea id="resumo" value={form.resumo} onChange={(e) => setForm({ ...form, resumo: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="conteudo">Conteúdo</Label>
                                    <Textarea id="conteudo" value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} className="min-h-[160px]" />
                                </div>
                                <label className="flex items-center gap-3 text-sm">
                                    <Switch checked={form.status === "publicado"} onCheckedChange={(v) => setForm({ ...form, status: v ? "publicado" : "rascunho" })} />
                                    Publicar imediatamente
                                </label>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={saving} className="rounded-xl">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar post"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
                    ) : posts.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground">
                            <Newspaper className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">Nenhum post ainda</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                                    <TableHead>Publicado</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {posts.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium">{p.titulo}</TableCell>
                                        <TableCell className="hidden sm:table-cell text-muted-foreground">{p.categoria ?? "—"}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch checked={p.status === "publicado"} onCheckedChange={() => togglePublish(p)} />
                                                <Badge variant="secondary" className={p.status === "publicado" ? "bg-green-500/15 text-green-600" : ""}>
                                                    {p.status === "publicado" ? "Publicado" : "Rascunho"}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {p.status === "publicado" && (
                                                    <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-primary p-1.5 hover:bg-muted rounded-lg"><ExternalLink className="h-4 w-4" /></a>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Excluir post?</AlertDialogTitle>
                                                            <AlertDialogDescription>“{p.titulo}” será removido permanentemente.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(p)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <form onSubmit={handleUpdate}>
                        <DialogHeader>
                            <DialogTitle>Editar post</DialogTitle>
                            <DialogDescription>Atualize as informações do post.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-titulo">Título *</Label>
                                <Input id="edit-titulo" value={editForm.titulo} onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label htmlFor="edit-cat">Categoria</Label><Input id="edit-cat" value={editForm.categoria} onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })} /></div>
                                <div className="grid gap-2"><Label htmlFor="edit-cover">Imagem de capa (URL)</Label><Input id="edit-cover" type="url" value={editForm.cover_url} onChange={(e) => setEditForm({ ...editForm, cover_url: e.target.value })} /></div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-resumo">Resumo</Label>
                                <Textarea id="edit-resumo" value={editForm.resumo} onChange={(e) => setEditForm({ ...editForm, resumo: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-conteudo">Conteúdo</Label>
                                <Textarea id="edit-conteudo" value={editForm.conteudo} onChange={(e) => setEditForm({ ...editForm, conteudo: e.target.value })} className="min-h-[160px]" />
                            </div>
                            <label className="flex items-center gap-3 text-sm">
                                <Switch checked={editForm.status === "publicado"} onCheckedChange={(v) => setEditForm({ ...editForm, status: v ? "publicado" : "rascunho" })} />
                                Publicado
                            </label>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={editSaving} className="rounded-xl">{editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar alterações"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
