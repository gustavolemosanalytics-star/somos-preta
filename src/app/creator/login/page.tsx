"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { verificarTurnstile } from "@/lib/turnstile"
import { useTurnstile } from "@/components/auth/turnstile"
import { LogoPreta } from "@/components/public/marca"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Eye, EyeOff } from "lucide-react"

export default function CriadorLoginPage() {
    const router = useRouter()
    const [supabase] = useState(() => createClient())
    const turnstile = useTurnstile()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const entrarComGoogle = async () => {
        setIsLoading(true)
        setError("")
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                // Mesmo caminho do cadastro: o callback troca o code por sessão
                // e confirma o papel antes de entregar a área do criador.
                redirectTo: `${window.location.origin}/auth/callback?origem=creator`,
            },
        })
        if (error) {
            setError("Não foi possível continuar com o Google. Tente pelo e-mail.")
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        const humano = await verificarTurnstile(turnstile.token)
        if (!humano) {
            setError("Não foi possível confirmar que você não é um robô. Tente de novo.")
            turnstile.reiniciar()
            setIsLoading(false)
            return
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setError(
                error.message.includes("Invalid")
                    ? "Email ou senha inválidos"
                    : error.message.includes("confirm")
                        ? "Confirme seu email antes de entrar"
                        : "Não foi possível entrar. Tente novamente."
            )
            turnstile.reiniciar()
            setIsLoading(false)
            return
        }

        router.push("/creator")
        router.refresh()
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center space-y-2">
                    <LogoPreta className="mx-auto h-9 w-auto" priority />
                    <h1 className="text-xl font-semibold text-foreground">Área do Creator</h1>
                    <p className="text-muted-foreground text-sm">Entre para acessar seu Media Kit</p>
                </div>

                <Card className="border-border/60 rounded-2xl">
                    <CardContent className="pt-6">
                        <button
                            type="button"
                            onClick={entrarComGoogle}
                            disabled={isLoading}
                            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm font-semibold transition-colors hover:bg-accent disabled:opacity-60"
                        >
                            <LogoGoogle />
                            Continuar com Google
                        </button>

                        <div className="my-6 flex items-center gap-4">
                            <span aria-hidden className="h-px flex-1 bg-border" />
                            <span className="text-xs text-muted-foreground">ou</span>
                            <span aria-hidden className="h-px flex-1 bg-border" />
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11 rounded-xl"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Senha</Label>
                                    <Link href="/creator/esqueci-senha" className="text-primary text-xs font-medium hover:underline">
                                        Esqueci minha senha
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-11 rounded-xl pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl text-center">
                                    {error}
                                </div>
                            )}

                            {turnstile.campo}

                            <Button
                                type="submit"
                                className="w-full h-11 rounded-xl font-semibold"
                                disabled={isLoading || !turnstile.pronto}
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-muted-foreground text-sm">
                    Não tem conta?{" "}
                    <Link href="/creator/criar-conta" className="text-primary font-medium hover:underline">
                        Criar conta
                    </Link>
                </p>
            </div>
        </div>
    )
}

function LogoGoogle() {
    return (
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden focusable="false">
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
            />
        </svg>
    )
}
