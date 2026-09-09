"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Monograma } from "@/components/public/marca"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        const supabase = createClient()
        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setError(
                error.message.includes("Invalid")
                    ? "Email ou senha inválidos"
                    : error.message.includes("confirm")
                        ? "Confirme seu email antes de entrar"
                        : "Não foi possível entrar. Tente novamente."
            )
            setIsLoading(false)
            return
        }

        // /app/login é a porta do sistema interno -> sempre dashboard.
        // O gate do painel decide: staff entra; sem acesso vai para /app/sem-acesso.
        router.push("/app/dashboard")
        router.refresh()
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 space-y-8">
                <div className="text-center space-y-3">
                    <Monograma className="h-12 w-12 text-lg mx-auto" />
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Somos Preta</h1>
                        <p className="text-muted-foreground text-sm">Plataforma de Gestão de Creators</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12 rounded-xl focus-visible:border-primary"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Senha</Label>
                            <Link href="/app/esqueci-senha" className="text-primary text-xs font-medium hover:underline">
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
                                className="h-12 rounded-xl focus-visible:border-primary pr-10"
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

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl font-bold text-lg"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
                    </Button>
                </form>

                <p className="text-center text-muted-foreground text-sm">
                    Não tem conta?{" "}
                    <Link href="/app/criar-conta" className="text-primary font-medium hover:underline">
                        Criar conta
                    </Link>
                </p>
            </div>
        </div>
    )
}
