"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { motion } from "framer-motion"
import { CheckCircle2, Loader2, Users, Image as ImageIcon, ArrowLeft, AlertCircle, BookOpen, Shield, Sparkles } from "lucide-react"
import type { InstagramGraphProfile } from "@/app/api/instagram/graph/route"

function InstagramIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
    )
}

function formatNumber(num: number): string {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
    return num.toString()
}

function CadastroContent() {
    const searchParams = useSearchParams()
    const { data: session, status } = useSession()
    const [step, setStep] = useState<"initial" | "loading" | "success" | "error">("initial")
    const [instagramData, setInstagramData] = useState<InstagramGraphProfile | null>(null)
    const [error, setError] = useState("")

    const isConnected = searchParams.get("connected") === "true"

    useEffect(() => {
        if (isConnected && status === "authenticated" && session?.accessToken && step === "initial") {
            fetchInstagramData()
        }
    }, [isConnected, status, session, step])

    async function fetchInstagramData() {
        setStep("loading")
        try {
            const res = await fetch("/api/instagram/graph")
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Erro ao buscar dados")
            }

            setInstagramData(data)

            await fetch("/api/creators", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name || data.username,
                    email: session?.user?.email || "",
                    facebookId: session?.user?.id || "",
                    instagramUsername: data.username,
                    instagramId: data.id,
                    instagramFollowers: data.followers_count,
                    instagramProfilePic: data.profile_picture_url,
                    instagramBio: data.biography,
                    instagramMediaCount: data.media_count,
                    accessToken: session?.accessToken || "",
                }),
            })

            setStep("success")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro desconhecido")
            setStep("error")
        }
    }

    function handleConnectInstagram() {
        signIn("facebook", { callbackUrl: "/cadastro?connected=true" })
    }

    if (step === "loading") {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6"
                >
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 mx-auto flex items-center justify-center shadow-lg animate-pulse">
                        <InstagramIcon className="h-10 w-10 text-white" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold">Buscando dados do Instagram...</h2>
                        <p className="text-muted-foreground">Conectando com a API oficial do Instagram</p>
                    </div>
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500" />
                </motion.div>
            </div>
        )
    }

    if (step === "success" && instagramData) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-sm overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />
                        <CardHeader className="text-center space-y-4 pb-2">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="mx-auto"
                            >
                                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                            </motion.div>
                            <div>
                                <CardTitle className="text-2xl">Cadastro Completo!</CardTitle>
                                <CardDescription>Seu Instagram foi conectado com sucesso</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50">
                                {instagramData.profile_picture_url ? (
                                    <img
                                        src={instagramData.profile_picture_url}
                                        alt={instagramData.username}
                                        className="h-16 w-16 rounded-full object-cover ring-2 ring-purple-500"
                                    />
                                ) : (
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                                        {instagramData.name?.charAt(0) || "?"}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-lg truncate">{instagramData.name}</p>
                                    <p className="text-muted-foreground text-sm">@{instagramData.username}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 rounded-xl bg-muted/50">
                                    <Users className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                                    <p className="font-bold">{formatNumber(instagramData.followers_count)}</p>
                                    <p className="text-xs text-muted-foreground">Seguidores</p>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-muted/50">
                                    <Users className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                                    <p className="font-bold">{formatNumber(instagramData.follows_count)}</p>
                                    <p className="text-xs text-muted-foreground">Seguindo</p>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-muted/50">
                                    <ImageIcon className="h-4 w-4 mx-auto mb-1 text-pink-500" />
                                    <p className="font-bold">{formatNumber(instagramData.media_count)}</p>
                                    <p className="text-xs text-muted-foreground">Posts</p>
                                </div>
                            </div>

                            {instagramData.biography && (
                                <p className="text-sm text-muted-foreground text-center italic">
                                    &quot;{instagramData.biography}&quot;
                                </p>
                            )}

                            <div className="space-y-3 pt-2">
                                <Link href="/">
                                    <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:opacity-90 font-bold text-lg">
                                        <Sparkles className="h-5 w-5 mr-2" />
                                        Voltar para a Home
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        )
    }

    if (step === "error") {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <Link href="/cadastro" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
                        <ArrowLeft className="h-4 w-4" /> Voltar
                    </Link>

                    <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-sm">
                        <CardHeader className="text-center space-y-4">
                            <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
                            <div>
                                <CardTitle className="text-2xl">Erro na Conexão</CardTitle>
                                <CardDescription className="text-destructive">{error}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-xl bg-muted/50 space-y-2 text-sm text-muted-foreground">
                                <p className="font-medium text-foreground">Requisitos:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Conta Instagram deve ser Profissional ou Creator</li>
                                    <li>Instagram deve estar conectado a uma Página do Facebook</li>
                                    <li>Permissões de acesso devem ser concedidas</li>
                                </ul>
                            </div>
                            <Button
                                onClick={() => { setStep("initial"); setError("") }}
                                className="w-full h-12 rounded-xl"
                                variant="outline"
                            >
                                Tentar Novamente
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        )
    }

    // Initial state
    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
                    <ArrowLeft className="h-4 w-4" /> Voltar
                </Link>

                <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-sm">
                    <CardHeader className="text-center space-y-4">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 mx-auto flex items-center justify-center shadow-lg">
                            <InstagramIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Cadastro de Creator</CardTitle>
                            <CardDescription>Conecte seu Instagram para participar da Somos Preta</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                                <Shield className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">Dados oficiais</p>
                                    <p className="text-xs text-muted-foreground">Seus dados são obtidos diretamente da API oficial do Instagram</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                                <Users className="h-5 w-5 text-pink-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">Perfil completo</p>
                                    <p className="text-xs text-muted-foreground">Seguidores, posts, biografia e foto de perfil</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                                <BookOpen className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">Visibilidade</p>
                                    <p className="text-xs text-muted-foreground">Seu perfil será visível para marcas e agências na plataforma</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                            <p className="text-xs text-muted-foreground">
                                <strong className="text-yellow-600 dark:text-yellow-400">Importante:</strong> Sua conta Instagram precisa ser do tipo Profissional ou Creator, e estar conectada a uma Página do Facebook.
                            </p>
                        </div>

                        <Button
                            onClick={handleConnectInstagram}
                            className="w-full h-14 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:opacity-90 font-bold text-lg gap-3 text-white"
                        >
                            <InstagramIcon className="h-6 w-6" />
                            Conectar com Instagram
                        </Button>

                        <p className="text-center text-xs text-muted-foreground">
                            Ao conectar, você autoriza a Somos Preta a acessar informações públicas do seu perfil do Instagram.
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}

export default function CadastroPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        }>
            <CadastroContent />
        </Suspense>
    )
}
