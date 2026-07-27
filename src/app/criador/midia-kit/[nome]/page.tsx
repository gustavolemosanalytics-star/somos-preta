"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { FileImage, ArrowLeft, ArrowRight, Check, User, AtSign, Briefcase, DollarSign, Palette, Eye, LogOut, Save, Plus, X, MapPin, Users, TrendingUp, Heart, ExternalLink, Copy, Info, AlertTriangle } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { MidiaKit } from "@/lib/db/types"
import { toast } from "sonner"

type MidiaKitData = {
    name: string
    bio: string
    city: string
    state: string
    instagram: string
    tiktok: string
    youtube: string
    whatsapp: string
    followers: string
    engagement: string
    avgLikes: string
    niches: string[]
    portfolio: { title: string; brand: string }[]
    packages: { name: string; price: string; description: string }[]
    primaryColor: string
}

const initialData: MidiaKitData = {
    name: "",
    bio: "",
    city: "",
    state: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    whatsapp: "",
    followers: "",
    engagement: "",
    avgLikes: "",
    niches: [],
    portfolio: [],
    packages: [],
    primaryColor: "#e57c4a",
}

const stepLabels = [
    { icon: User, label: "Dados Pessoais" },
    { icon: AtSign, label: "Redes Sociais" },
    { icon: Briefcase, label: "Portfólio" },
    { icon: DollarSign, label: "Pacotes" },
    { icon: Palette, label: "Personalizar" },
]

const nicheOptions = ["Moda", "Beleza", "Lifestyle", "Tech", "Games", "Fitness", "Gastronomia", "Viagem", "Humor", "Música", "Educação", "Arte", "Maternidade", "Esporte", "Natureza", "Culinária"]

const colorOptions = [
    { name: "Terracota", value: "#e57c4a" },
    { name: "Esmeralda", value: "#10b981" },
    { name: "Roxo", value: "#8b5cf6" },
    { name: "Azul", value: "#3b82f6" },
    { name: "Rosa", value: "#ec4899" },
    { name: "Dourado", value: "#f59e0b" },
]

function MidiaKitPreview({ data }: { data: MidiaKitData }) {
    const initials = data.name ? data.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "MK"

    return (
        <div className="bg-background rounded-2xl border border-border/50 overflow-hidden shadow-inner max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Header */}
            <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${data.primaryColor}, ${data.primaryColor}88)` }}>
                <div className="absolute -bottom-8 left-6">
                    <Avatar className="h-16 w-16 border-4 border-background shadow-lg">
                        <AvatarFallback className="text-xl font-bold" style={{ background: `${data.primaryColor}22`, color: data.primaryColor }}>
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>

            <div className="pt-12 px-6 pb-6 space-y-6">
                {/* Name & Bio */}
                <div>
                    <h2 className="text-xl font-bold">{data.name || "Seu Nome"}</h2>
                    {data.instagram && <p className="text-sm text-muted-foreground">{data.instagram.startsWith("@") ? data.instagram : `@${data.instagram}`}</p>}
                    {(data.city || data.state) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            {[data.city, data.state].filter(Boolean).join(", ")}
                        </div>
                    )}
                    {data.bio && <p className="text-sm text-muted-foreground mt-2">{data.bio}</p>}
                </div>

                {/* Niches */}
                {data.niches.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {data.niches.map((n) => (
                            <Badge key={n} variant="secondary" className="text-[10px] px-2 py-0.5 rounded-lg">{n}</Badge>
                        ))}
                    </div>
                )}

                {/* Metrics */}
                {(data.followers || data.engagement || data.avgLikes) && (
                    <div className="grid grid-cols-3 gap-2">
                        {data.followers && (
                            <div className="text-center p-2 rounded-xl bg-muted/30">
                                <Users className="h-3 w-3 mx-auto mb-1" style={{ color: data.primaryColor }} />
                                <p className="text-sm font-bold">{data.followers}</p>
                                <p className="text-[10px] text-muted-foreground">Seguidores</p>
                            </div>
                        )}
                        {data.engagement && (
                            <div className="text-center p-2 rounded-xl bg-muted/30">
                                <TrendingUp className="h-3 w-3 mx-auto mb-1" style={{ color: data.primaryColor }} />
                                <p className="text-sm font-bold">{data.engagement}%</p>
                                <p className="text-[10px] text-muted-foreground">Engajamento</p>
                            </div>
                        )}
                        {data.avgLikes && (
                            <div className="text-center p-2 rounded-xl bg-muted/30">
                                <Heart className="h-3 w-3 mx-auto mb-1" style={{ color: data.primaryColor }} />
                                <p className="text-sm font-bold">{data.avgLikes}</p>
                                <p className="text-[10px] text-muted-foreground">Média Likes</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Social Links */}
                {(data.tiktok || data.youtube) && (
                    <div className="space-y-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Redes Sociais</p>
                        <div className="flex gap-2 flex-wrap">
                            {data.instagram && <Badge variant="outline" className="text-[10px] rounded-lg">{data.instagram}</Badge>}
                            {data.tiktok && <Badge variant="outline" className="text-[10px] rounded-lg">TikTok: {data.tiktok}</Badge>}
                            {data.youtube && <Badge variant="outline" className="text-[10px] rounded-lg">YT: {data.youtube}</Badge>}
                        </div>
                    </div>
                )}

                {/* Portfolio */}
                {data.portfolio.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Portfólio</p>
                        {data.portfolio.map((item, i) => (
                            <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border/30">
                                <p className="text-sm font-bold">{item.title}</p>
                                <p className="text-xs text-muted-foreground">{item.brand}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Packages */}
                {data.packages.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pacotes</p>
                        {data.packages.map((pkg, i) => (
                            <div key={i} className="p-3 rounded-xl border border-border/30" style={{ borderLeftColor: data.primaryColor, borderLeftWidth: 3 }}>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-bold">{pkg.name}</p>
                                    <p className="text-sm font-bold" style={{ color: data.primaryColor }}>{pkg.price}</p>
                                </div>
                                {pkg.description && <p className="text-xs text-muted-foreground mt-1">{pkg.description}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function MidiaKitCriarPage() {
    const router = useRouter()
    const [supabase] = useState(() => createClient())
    const [currentStep, setCurrentStep] = useState(0)
    const [data, setData] = useState<MidiaKitData>(initialData)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [saving, setSaving] = useState(false)
    const [savedSlug, setSavedSlug] = useState<string | null>(null)
    const [existingId, setExistingId] = useState<string | null>(null)
    const [existingSlug, setExistingSlug] = useState<string | null>(null)
    const [publicado, setPublicado] = useState(true)
    const [email, setEmail] = useState("")
    const [newPortfolio, setNewPortfolio] = useState({ title: "", brand: "" })
    const [newPackage, setNewPackage] = useState({ name: "", price: "", description: "" })

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push("/criador/login"); return }
            setEmail(user.email ?? "")
            const { data: prof } = await supabase.from("somos_preta_profiles").select("nome, role").eq("id", user.id).single()
            // 'pendente' (cadastro interno sem liberação) não acessa a área do creator
            if (prof?.role === "pendente") { router.push("/app/sem-acesso"); return }
            const { data: kit } = await supabase
                .from("somos_preta_midia_kits")
                .select("*")
                .eq("cadastrado_por", user.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle()
            if (kit) {
                const k = kit as MidiaKit
                const redes = (k.redes ?? {}) as Record<string, string>
                setData({
                    name: k.nome ?? "",
                    bio: k.bio ?? "",
                    city: k.cidade ?? "",
                    state: k.estado ?? "",
                    instagram: redes.instagram ?? "",
                    tiktok: redes.tiktok ?? "",
                    youtube: redes.youtube ?? "",
                    whatsapp: k.whatsapp ?? "",
                    followers: redes.followers ?? "",
                    engagement: redes.engagement ?? "",
                    avgLikes: redes.avgLikes ?? "",
                    niches: k.nichos ?? [],
                    portfolio: (k.portfolio as MidiaKitData["portfolio"]) ?? [],
                    packages: (k.pacotes as MidiaKitData["packages"]) ?? [],
                    primaryColor: k.tema ?? "#e57c4a",
                })
                setExistingId(k.id)
                setExistingSlug(k.slug)
                setPublicado(k.publicado ?? true)
            } else {
                setData((prev) => ({ ...prev, name: prof?.nome ?? "" }))
            }
            setIsAuthenticated(true)
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const slugify = (s: string) =>
        s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "kit"

    async function handleSave() {
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push("/criador/login"); return }
        const payload = {
            nome: data.name || "Meu mídia kit",
            email: email || null,
            whatsapp: data.whatsapp || null,
            bio: data.bio || null,
            cidade: data.city || null,
            estado: data.state || null,
            nichos: data.niches,
            tema: data.primaryColor,
            redes: {
                instagram: data.instagram, tiktok: data.tiktok, youtube: data.youtube,
                followers: data.followers, engagement: data.engagement, avgLikes: data.avgLikes,
            },
            portfolio: data.portfolio,
            pacotes: data.packages,
            publicado,
            cadastrado_por: user.id,
        }

        if (existingId) {
            const { error } = await supabase.from("somos_preta_midia_kits").update(payload).eq("id", existingId)
            if (error) { toast.error("Não foi possível salvar"); setSaving(false); return }
            setSavedSlug(existingSlug)
        } else {
            const base = slugify(data.name || data.instagram || "kit")
            let saved: { id: string; slug: string } | null = null
            for (let attempt = 0; attempt < 3 && !saved; attempt++) {
                const trySlug = attempt === 0 ? base : `${base}-${Math.floor(1000 + Math.random() * 9000)}`
                const res = await supabase.from("somos_preta_midia_kits").insert({ ...payload, slug: trySlug }).select("id, slug").single()
                if (!res.error) saved = res.data as { id: string; slug: string }
                else if (res.error.code !== "23505") { toast.error("Não foi possível salvar"); setSaving(false); return }
            }
            if (!saved) { toast.error("Slug em uso, tente outro nome"); setSaving(false); return }
            setExistingId(saved.id); setExistingSlug(saved.slug); setSavedSlug(saved.slug)
        }
        toast.success("Mídia kit salvo!")
        setSaving(false)
    }

    async function copiarLink() {
        if (!existingSlug) return
        await navigator.clipboard.writeText(`${window.location.origin}/kit/${existingSlug}`)
        toast.success("Link copiado!")
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/")
    }

    const progress = ((currentStep + 1) / stepLabels.length) * 100

    if (!isAuthenticated) return null

    return (
        <div className="min-h-[calc(100vh-4rem)]">
            <div className="container mx-auto px-4 py-6">
                {/* Top Bar */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <FileImage className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">Mídia Kit Builder</h1>
                            <p className="text-xs text-muted-foreground">Passo {currentStep + 1} de {stepLabels.length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl lg:hidden"
                            onClick={() => setShowPreview(!showPreview)}
                        >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                        </Button>
                        {existingSlug && publicado && (
                            <>
                                <Button asChild variant="outline" size="sm" className="rounded-xl">
                                    <a href={`/kit/${existingSlug}`} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-1" /> Ver meu kit
                                    </a>
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-xl" onClick={copiarLink}>
                                    <Copy className="h-4 w-4 mr-1" /> Copiar link
                                </Button>
                            </>
                        )}
                        <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-1" /> Sair
                        </Button>
                    </div>
                </div>

                {existingId && !publicado && (
                    <div className="mb-4 rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-500 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        Seu mídia kit está como <strong>rascunho</strong> — publique (na última etapa) para gerar o link público.
                    </div>
                )}
                {!existingId && (
                    <div className="mb-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-start gap-2">
                        <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                        <span><strong className="text-foreground">Primeiros passos:</strong> preencha as 5 etapas, acompanhe no preview ao lado e clique em <strong>Salvar</strong> na última etapa para publicar e gerar seu link.</span>
                    </div>
                )}

                {/* Progress */}
                <div className="mb-6">
                    <Progress value={progress} className="h-2 mb-4" />
                    <div className="flex justify-between">
                        {stepLabels.map((step, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentStep(i)}
                                className={`flex flex-col items-center gap-1 transition-all ${
                                    i === currentStep ? "text-primary" : i < currentStep ? "text-emerald-500" : "text-muted-foreground/40"
                                }`}
                            >
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                    i < currentStep
                                        ? "bg-emerald-500 text-white"
                                        : i === currentStep
                                        ? "bg-primary text-white"
                                        : "bg-muted/50"
                                }`}>
                                    {i < currentStep ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                                </div>
                                <span className="text-[10px] font-medium hidden sm:block">{step.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Form */}
                    <div>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                {/* Step 0: Personal Info */}
                                {currentStep === 0 && (
                                    <Card className="border-none bg-card/50">
                                        <CardHeader>
                                            <CardTitle>Informações Pessoais</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Nome completo</Label>
                                                <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="Seu nome" className="rounded-xl" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Bio / Sobre você</Label>
                                                <Textarea value={data.bio} onChange={(e) => setData({ ...data, bio: e.target.value })} placeholder="Conte sobre você, seu trabalho e sua proposta..." className="rounded-xl min-h-[100px]" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Cidade</Label>
                                                    <Input value={data.city} onChange={(e) => setData({ ...data, city: e.target.value })} placeholder="Sua cidade" className="rounded-xl" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Estado</Label>
                                                    <Input value={data.state} onChange={(e) => setData({ ...data, state: e.target.value })} placeholder="UF" className="rounded-xl" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Nichos</Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {nicheOptions.map((n) => (
                                                        <button
                                                            key={n}
                                                            type="button"
                                                            onClick={() => {
                                                                setData({
                                                                    ...data,
                                                                    niches: data.niches.includes(n)
                                                                        ? data.niches.filter((x) => x !== n)
                                                                        : [...data.niches, n],
                                                                })
                                                            }}
                                                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                                                                data.niches.includes(n)
                                                                    ? "bg-emerald-500 text-white"
                                                                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                                            }`}
                                                        >
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Step 1: Social Media */}
                                {currentStep === 1 && (
                                    <Card className="border-none bg-card/50">
                                        <CardHeader>
                                            <CardTitle>Redes Sociais & Métricas</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Instagram</Label>
                                                <Input value={data.instagram} onChange={(e) => setData({ ...data, instagram: e.target.value })} placeholder="@seuinstagram" className="rounded-xl" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>TikTok</Label>
                                                <Input value={data.tiktok} onChange={(e) => setData({ ...data, tiktok: e.target.value })} placeholder="@seutiktok" className="rounded-xl" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>YouTube</Label>
                                                <Input value={data.youtube} onChange={(e) => setData({ ...data, youtube: e.target.value })} placeholder="Seu canal" className="rounded-xl" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>WhatsApp (para contratação)</Label>
                                                <Input value={data.whatsapp} onChange={(e) => setData({ ...data, whatsapp: e.target.value })} placeholder="Ex: 5571999999999" className="rounded-xl" />
                                            </div>
                                            <div className="border-t border-border/50 pt-4 mt-4">
                                                <p className="text-sm font-bold mb-4">Métricas</p>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Seguidores</Label>
                                                        <Input value={data.followers} onChange={(e) => setData({ ...data, followers: e.target.value })} placeholder="12.5K" className="rounded-xl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Engajamento (%)</Label>
                                                        <Input value={data.engagement} onChange={(e) => setData({ ...data, engagement: e.target.value })} placeholder="4.5" className="rounded-xl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Média Likes</Label>
                                                        <Input value={data.avgLikes} onChange={(e) => setData({ ...data, avgLikes: e.target.value })} placeholder="890" className="rounded-xl" />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Step 2: Portfolio */}
                                {currentStep === 2 && (
                                    <Card className="border-none bg-card/50">
                                        <CardHeader>
                                            <CardTitle>Portfólio</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <p className="text-sm text-muted-foreground">Adicione seus melhores trabalhos e campanhas anteriores.</p>

                                            {data.portfolio.map((item, i) => (
                                                <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/30">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold">{item.title}</p>
                                                        <p className="text-xs text-muted-foreground">{item.brand}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setData({ ...data, portfolio: data.portfolio.filter((_, j) => j !== i) })}
                                                        className="text-muted-foreground hover:text-destructive"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}

                                            <div className="space-y-3 p-4 rounded-xl border border-dashed border-border/50">
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Nome do Trabalho</Label>
                                                    <Input value={newPortfolio.title} onChange={(e) => setNewPortfolio({ ...newPortfolio, title: e.target.value })} placeholder="Ex: Campanha Verão 2025" className="rounded-xl" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Marca/Cliente</Label>
                                                    <Input value={newPortfolio.brand} onChange={(e) => setNewPortfolio({ ...newPortfolio, brand: e.target.value })} placeholder="Ex: Coca-Cola" className="rounded-xl" />
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-xl"
                                                    disabled={!newPortfolio.title || !newPortfolio.brand}
                                                    onClick={() => {
                                                        setData({ ...data, portfolio: [...data.portfolio, newPortfolio] })
                                                        setNewPortfolio({ title: "", brand: "" })
                                                    }}
                                                >
                                                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Step 3: Packages */}
                                {currentStep === 3 && (
                                    <Card className="border-none bg-card/50">
                                        <CardHeader>
                                            <CardTitle>Pacotes & Valores</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <p className="text-sm text-muted-foreground">Defina seus pacotes de serviço e valores.</p>

                                            {data.packages.map((pkg, i) => (
                                                <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-muted/30 border border-border/30">
                                                    <div className="flex-1">
                                                        <div className="flex justify-between">
                                                            <p className="text-sm font-bold">{pkg.name}</p>
                                                            <p className="text-sm font-bold text-emerald-500">{pkg.price}</p>
                                                        </div>
                                                        {pkg.description && <p className="text-xs text-muted-foreground mt-1">{pkg.description}</p>}
                                                    </div>
                                                    <button
                                                        onClick={() => setData({ ...data, packages: data.packages.filter((_, j) => j !== i) })}
                                                        className="text-muted-foreground hover:text-destructive mt-0.5"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}

                                            <div className="space-y-3 p-4 rounded-xl border border-dashed border-border/50">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Nome do Pacote</Label>
                                                        <Input value={newPackage.name} onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })} placeholder="Ex: Story + Reels" className="rounded-xl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Valor</Label>
                                                        <Input value={newPackage.price} onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })} placeholder="Ex: R$ 500" className="rounded-xl" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Descrição</Label>
                                                    <Input value={newPackage.description} onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })} placeholder="O que está incluído neste pacote" className="rounded-xl" />
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-xl"
                                                    disabled={!newPackage.name || !newPackage.price}
                                                    onClick={() => {
                                                        setData({ ...data, packages: [...data.packages, newPackage] })
                                                        setNewPackage({ name: "", price: "", description: "" })
                                                    }}
                                                >
                                                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Step 4: Customize */}
                                {currentStep === 4 && (
                                    <Card className="border-none bg-card/50">
                                        <CardHeader>
                                            <CardTitle>Personalizar Visual</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="space-y-3">
                                                <Label>Cor Principal</Label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {colorOptions.map((color) => (
                                                        <button
                                                            key={color.value}
                                                            onClick={() => setData({ ...data, primaryColor: color.value })}
                                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                                                data.primaryColor === color.value
                                                                    ? "border-foreground shadow-lg"
                                                                    : "border-border/50 hover:border-border"
                                                            }`}
                                                        >
                                                            <div className="h-8 w-8 rounded-full shadow-inner" style={{ background: color.value }} />
                                                            <span className="text-xs font-medium">{color.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-border/60 bg-muted/20 p-6 text-center space-y-4">
                                                <Check className="h-8 w-8 text-primary mx-auto" />
                                                <h3 className="font-semibold text-lg">Seu mídia kit está pronto!</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Revise no preview ao lado. Salve como rascunho ou publique para gerar o link público.
                                                </p>
                                                <label className="flex items-center justify-center gap-3 text-sm cursor-pointer">
                                                    <Switch checked={publicado} onCheckedChange={setPublicado} />
                                                    {publicado ? "Publicado (visível no link)" : "Rascunho (só você vê)"}
                                                </label>
                                                <Button onClick={handleSave} disabled={saving} className="rounded-xl font-medium">
                                                    <Save className="h-4 w-4 mr-2" /> {saving ? "Salvando..." : "Salvar mídia kit"}
                                                </Button>
                                                {savedSlug && publicado && (
                                                    <Link href={`/kit/${savedSlug}`} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary font-medium hover:underline">
                                                        Ver meu mídia kit público →
                                                    </Link>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation */}
                        <div className="flex justify-between mt-6">
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                                disabled={currentStep === 0}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
                            </Button>
                            <Button
                                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90"
                                onClick={() => setCurrentStep(Math.min(stepLabels.length - 1, currentStep + 1))}
                                disabled={currentStep === stepLabels.length - 1}
                            >
                                Próximo <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>

                    {/* Preview - Desktop */}
                    <div className="hidden lg:block">
                        <div className="sticky top-24">
                            <p className="text-sm font-bold mb-3 flex items-center gap-2">
                                <Eye className="h-4 w-4" /> Preview em tempo real
                            </p>
                            <MidiaKitPreview data={data} />
                        </div>
                    </div>
                </div>

                {/* Mobile Preview Modal */}
                {showPreview && (
                    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden">
                        <div className="p-4 h-full overflow-auto">
                            <div className="flex justify-between items-center mb-4">
                                <p className="font-bold">Preview</p>
                                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <MidiaKitPreview data={data} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
