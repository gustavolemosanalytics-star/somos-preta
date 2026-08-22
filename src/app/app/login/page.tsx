"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
        <div className="min-h-screen flex items-center justify-center bg-[#0d0d14] p-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">Somos Preta</h1>
                    <p className="text-white/50 text-sm">Plataforma de Gestão de Creators</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-white/70">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-primary focus:ring-primary"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-white/70">Senha</Label>
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
                                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-primary focus:ring-primary pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-lg"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
                    </Button>
                </form>

                <p className="text-center text-white/50 text-sm">
                    Não tem conta?{" "}
                    <Link href="/app/criar-conta" className="text-primary font-medium hover:underline">
                        Criar conta
                    </Link>
                </p>
            </div>
        </div>
    )
}
