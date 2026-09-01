"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle2 } from "lucide-react"

export default function CriadorCriarContaPage() {
    const router = useRouter()
    const [supabase] = useState(() => createClient())
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [done, setDone] = useState(false)
    const [nome, setNome] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { nome, role_hint: "creator" } },
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

        if (data.session) {
            router.push("/criador")
            router.refresh()
            return
        }

        setDone(true)
        setIsLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center space-y-2">
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center mx-auto">
                        <span className="text-primary-foreground font-bold text-lg">S</span>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">Crie seu Media Kit</h1>
                    <p className="text-muted-foreground text-sm">Cadastre-se para montar seu perfil profissional</p>
                </div>

                {done ? (
                    <Card className="border-border/60 rounded-2xl">
                        <CardContent className="pt-6 text-center space-y-4">
                            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                            <p className="font-medium">Confira seu email</p>
                            <p className="text-muted-foreground text-sm">
                                Enviamos um link de confirmação para <strong>{email}</strong>. Confirme
                                para acessar a plataforma.
                            </p>
                            <Link href="/criador/login" className="text-primary text-sm font-medium hover:underline inline-block">
                                Voltar para o login
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-border/60 rounded-2xl">
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="nome">Nome</Label>
                                    <Input
                                        id="nome"
                                        type="text"
                                        placeholder="Seu nome"
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        className="h-11 rounded-xl"
                                        required
                                    />
                                </div>
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
                                    <Label htmlFor="password">Senha</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="mínimo 6 caracteres"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        minLength={6}
                                        className="h-11 rounded-xl"
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl text-center">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-11 rounded-xl font-semibold"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar conta"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <p className="text-center text-muted-foreground text-sm">
                    Já tem conta?{" "}
                    <Link href="/criador/login" className="text-primary font-medium hover:underline">
                        Entrar
                    </Link>
                </p>
            </div>
        </div>
    )
}
