"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2 } from "lucide-react"
import { creatorAreaPath } from "@/lib/creator-route"

export default function RegistroPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [done, setDone] = useState<null | "confirm" | "logged">(null)
    const [nome, setNome] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        const supabase = createClient()
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { nome } },
        })

        if (error) {
            setError(
                error.message.includes("already")
                    ? "Este email já está cadastrado"
                    : "Não foi possível criar a conta. Tente novamente."
            )
            setIsLoading(false)
            return
        }

        // Novo cadastro entra como 'creator' -> vai para a área do creator.
        // (um admin promove a staff pela tela de Usuários, se for o caso.)
        if (data.session) {
            router.push(await creatorAreaPath(supabase))
            router.refresh()
            return
        }

        setDone("confirm")
        setIsLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0d0d14] p-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">Somos Preta</h1>
                    <p className="text-white/50 text-sm">Criar sua conta</p>
                </div>

                {done === "confirm" ? (
                    <div className="text-center space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6">
                        <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                        <p className="text-white font-medium">Confira seu email</p>
                        <p className="text-white/50 text-sm">
                            Enviamos um link de confirmação para <strong>{email}</strong>. Confirme
                            para acessar a plataforma.
                        </p>
                        <Link href="/app/login" className="text-primary text-sm font-medium hover:underline inline-block">
                            Voltar para o login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="nome" className="text-white/70">Nome</Label>
                            <Input
                                id="nome"
                                type="text"
                                placeholder="Seu nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-primary focus:ring-primary"
                                required
                            />
                        </div>
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
                            <Label htmlFor="password" className="text-white/70">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-primary focus:ring-primary"
                                required
                            />
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
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar conta"}
                        </Button>
                    </form>
                )}

                <p className="text-center text-white/50 text-sm">
                    Já tem conta?{" "}
                    <Link href="/app/login" className="text-primary font-medium hover:underline">
                        Entrar
                    </Link>
                </p>
            </div>
        </div>
    )
}
