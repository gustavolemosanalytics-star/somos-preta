"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { MidiaKit } from "@/lib/db/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { IdCard, Loader2, Search, ExternalLink, MapPin, UserCircle, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

type KitRow = MidiaKit & { cadastrado: { nome: string | null; email: string | null } | null }

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()

export default function MediaKitsPage() {
    const [supabase] = useState(() => createClient())
    const [kits, setKits] = useState<KitRow[]>([])
    const [loading, setLoading] = useState(true)
    const [busca, setBusca] = useState("")

    const load = async () => {
        const { data } = await supabase
            .from("somos_preta_midia_kits")
            .select("*, cadastrado:somos_preta_profiles(nome, email)")
            .order("created_at", { ascending: false })
        setKits((data as unknown as KitRow[]) ?? [])
        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const filtrados = useMemo(() => {
        const q = busca.trim().toLowerCase()
        if (!q) return kits
        return kits.filter((k) => k.nome.toLowerCase().includes(q) || (k.nichos ?? []).some((n) => n.toLowerCase().includes(q)))
    }, [kits, busca])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><IdCard className="h-6 w-6 text-primary" /> Mídia Kits</h1>
                <p className="text-muted-foreground text-sm">Mídia kits criados pelos creators no site. {kits.length} no total.</p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome ou nicho..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9 rounded-xl" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
            ) : filtrados.length === 0 ? (
                <Card><CardContent className="py-16 text-center text-muted-foreground">
                    <IdCard className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Nenhum mídia kit ainda</p>
                    <p className="text-sm">Os kits criados pelos creators no site externo aparecem aqui.</p>
                </CardContent></Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtrados.map((k) => (
                        <Card key={k.id} className="overflow-hidden relative">
                            <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-lg bg-background/80 p-0.5 backdrop-blur-sm">
                                <KitActions k={k} supabase={supabase} onChanged={load} />
                            </div>
                            <div className="h-16 bg-gradient-to-r from-primary/25 to-secondary/25" style={k.cover_url ? { backgroundImage: `url(${k.cover_url})`, backgroundSize: "cover" } : undefined} />
                            <CardHeader className="pb-3 -mt-8">
                                <div className="flex items-end justify-between">
                                    <Avatar className="h-14 w-14 ring-4 ring-background">
                                        <AvatarImage src={k.avatar_url ?? undefined} alt={k.nome} />
                                        <AvatarFallback>{initials(k.nome)}</AvatarFallback>
                                    </Avatar>
                                    {k.publicado ? (
                                        <Badge className="bg-green-500/15 text-green-600" variant="secondary">Publicado</Badge>
                                    ) : (
                                        <Badge variant="secondary">Rascunho</Badge>
                                    )}
                                </div>
                                <div className="pt-2">
                                    <p className="font-semibold">{k.nome}</p>
                                    {(k.cidade || k.estado) && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{[k.cidade, k.estado].filter(Boolean).join(" / ")}</p>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {k.nichos && k.nichos.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {k.nichos.slice(0, 4).map((n) => <Badge key={n} variant="outline" className="text-[10px]">{n}</Badge>)}
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <UserCircle className="h-3.5 w-3.5" />
                                    Cadastrado por {k.cadastrado?.nome ?? k.cadastrado?.email ?? "creator"}
                                </div>
                                <a href={`/kit/${k.slug}`} target="_blank" rel="noopener noreferrer" className="text-primary text-sm inline-flex items-center gap-1 hover:underline">
                                    Ver mídia kit público <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

function KitActions({ k, supabase, onChanged }: { k: KitRow; supabase: ReturnType<typeof createClient>; onChanged: () => void | Promise<void> }) {
    const [editOpen, setEditOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [nome, setNome] = useState(k.nome)
    const [cidade, setCidade] = useState(k.cidade ?? "")
    const [estado, setEstado] = useState(k.estado ?? "")
    const [publicado, setPublicado] = useState(k.publicado)

    const openEdit = () => {
        setNome(k.nome)
        setCidade(k.cidade ?? "")
        setEstado(k.estado ?? "")
        setPublicado(k.publicado)
        setEditOpen(true)
    }

    const salvar = async () => {
        setSaving(true)
        const { error } = await supabase
            .from("somos_preta_midia_kits")
            .update({ nome, cidade: cidade || null, estado: estado || null, publicado })
            .eq("id", k.id)
        setSaving(false)
        if (error) {
            toast.error("Erro ao atualizar mídia kit")
            return
        }
        setEditOpen(false)
        await onChanged()
        toast.success("Mídia kit atualizado")
    }

    const excluir = async () => {
        setDeleting(true)
        const { error } = await supabase.from("somos_preta_midia_kits").delete().eq("id", k.id)
        setDeleting(false)
        if (error) {
            toast.error("Erro ao excluir mídia kit")
            return
        }
        await onChanged()
        toast.success("Mídia kit excluído")
    }

    return (
        <>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={openEdit} aria-label="Editar mídia kit">
                <Pencil className="h-3.5 w-3.5" />
            </Button>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" aria-label="Excluir mídia kit">
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir mídia kit?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O mídia kit &quot;{k.nome}&quot; será removido permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={excluir} disabled={deleting}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar mídia kit</DialogTitle>
                        <DialogDescription>Atualize as informações básicas do mídia kit.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor={`nome-${k.id}`}>Nome</Label>
                            <Input id={`nome-${k.id}`} value={nome} onChange={(e) => setNome(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor={`cidade-${k.id}`}>Cidade</Label>
                                <Input id={`cidade-${k.id}`} value={cidade} onChange={(e) => setCidade(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor={`estado-${k.id}`}>Estado (UF)</Label>
                                <Input id={`estado-${k.id}`} value={estado} maxLength={2} onChange={(e) => setEstado(e.target.value.toUpperCase())} />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor={`publicado-${k.id}`}>Publicado</Label>
                            <Switch id={`publicado-${k.id}`} checked={publicado} onCheckedChange={setPublicado} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancelar</Button>
                        <Button onClick={salvar} disabled={saving || !nome.trim()}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
