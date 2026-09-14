"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, Settings2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import type { Area, Profile } from "@/lib/db/types"
import { AreasCard } from "./areas-card"

const PAPEL_LABEL: Record<string, string> = {
    admin: "Administrador",
    gestor: "Gestor",
    analista: "Analista",
    creator: "Criador",
    pendente: "Aguardando liberação",
}

export default function ConfiguracoesPage() {
    const [supabase] = useState(() => createClient())

    const [eu, setEu] = useState<Profile | null>(null)
    const [equipe, setEquipe] = useState<Profile[]>([])
    const [areas, setAreas] = useState<Area[]>([])
    const [loading, setLoading] = useState(true)

    const [nome, setNome] = useState("")
    const [cargo, setCargo] = useState("")
    const [avatar, setAvatar] = useState("")
    const [salvando, setSalvando] = useState(false)

    async function carregar() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        const [meu, time, ars] = await Promise.all([
            user
                ? supabase.from("somos_preta_profiles").select("*").eq("id", user.id).maybeSingle()
                : Promise.resolve({ data: null, error: null }),
            supabase.from("somos_preta_profiles").select("*").order("nome"),
            supabase.from("somos_preta_areas").select("*").order("ordem"),
        ])

        if (!meu.error && meu.data) {
            const p = meu.data as Profile
            setEu(p)
            setNome(p.nome ?? "")
            setCargo(p.cargo ?? "")
            setAvatar(p.avatar_url ?? "")
        }
        if (!time.error) setEquipe((time.data ?? []) as Profile[])
        if (!ars.error) setAreas((ars.data ?? []) as Area[])
        setLoading(false)
    }

    useEffect(() => {
        carregar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function salvarPerfil(e: React.FormEvent) {
        e.preventDefault()
        if (!eu) return
        setSalvando(true)
        // .select("id") porque update barrado pela RLS não devolve erro, devolve
        // zero linhas — e a tela diria "salvo" para nada.
        const { data, error } = await supabase
            .from("somos_preta_profiles")
            .update({
                nome: nome.trim() || null,
                cargo: cargo.trim() || null,
                avatar_url: avatar.trim() || null,
            })
            .eq("id", eu.id)
            .select("id")
        setSalvando(false)
        if (error || !data?.length) { toast.error("Não foi possível salvar o perfil"); return }
        toast.success("Perfil atualizado")
        carregar()
    }

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-160px)] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-5 sm:space-y-6">
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                    <Settings2 className="h-6 w-6 text-primary" /> Configurações
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Seu perfil, as áreas da PRETA e quem tem acesso à plataforma.
                </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                {/* ---------- perfil ---------- */}
                <Card className="rounded-2xl">
                    <CardContent className="p-4 sm:p-5">
                        <p className="text-sm font-semibold">Seu perfil</p>
                        <p className="text-xs text-muted-foreground">
                            O cargo aparece ao lado do seu nome nas contas que você atende.
                        </p>

                        <form onSubmit={salvarPerfil} className="mt-4 space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-14 w-14">
                                    {avatar && <AvatarImage src={avatar} alt={nome} />}
                                    <AvatarFallback>{(nome || eu?.email || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{eu?.email}</p>
                                    <Badge variant="secondary" className="mt-1">
                                        {PAPEL_LABEL[eu?.role ?? ""] ?? eu?.role}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="nome">Nome</Label>
                                    <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="cargo">Cargo</Label>
                                    <Input
                                        id="cargo" placeholder="Account Manager"
                                        value={cargo} onChange={(e) => setCargo(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="avatar">Foto (URL)</Label>
                                <Input
                                    id="avatar" type="url" placeholder="https://..."
                                    value={avatar} onChange={(e) => setAvatar(e.target.value)}
                                />
                            </div>

                            <Button type="submit" disabled={salvando} className="rounded-xl">
                                {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar perfil"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <AreasCard areas={areas} onMudou={carregar} />
            </div>

            {/* ---------- equipe ---------- */}
            <Card className="rounded-2xl">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-sm font-semibold">Equipe</p>
                            <p className="text-xs text-muted-foreground">Quem tem acesso à plataforma.</p>
                        </div>
                        {eu?.role === "admin" && (
                            <Button asChild variant="outline" size="sm" className="rounded-xl">
                                <Link href="/usuarios">
                                    <ShieldCheck className="h-3.5 w-3.5" /> Gerenciar acessos
                                </Link>
                            </Button>
                        )}
                    </div>

                    <ul className="mt-4 divide-y">
                        {equipe.map((p) => (
                            <li key={p.id} className="flex items-center gap-3 py-2.5">
                                <Avatar className="h-8 w-8">
                                    {p.avatar_url && <AvatarImage src={p.avatar_url} alt={p.nome ?? ""} />}
                                    <AvatarFallback className="text-[10px]">
                                        {(p.nome ?? p.email ?? "?").slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1 leading-tight">
                                    <p className="truncate text-sm font-medium">{p.nome ?? p.email}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {p.cargo ?? p.email}
                                    </p>
                                </div>
                                <Badge variant="secondary">{PAPEL_LABEL[p.role] ?? p.role}</Badge>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
