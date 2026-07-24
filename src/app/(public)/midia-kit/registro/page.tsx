"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { FileImage, ArrowLeft, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"

export default function MidiaKitRegistroPage() {
    const router = useRouter()
    const [supabase] = useState(() => createClient())
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [confirm, setConfirm] = useState(false)
    const [form, setForm] = useState({ name: "", email: "", instagram: "", password: "" })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        if (!form.name || !form.email || !form.password) { setError("Preencha nome, email e senha."); return }
        if (form.password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return }

        setIsLoading(true)
        const { data, error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: { data: { nome: form.name, instagram: form.instagram } },
        })
        if (error) {
            setError(error.message.includes("already") ? "Este email já está cadastrado." : "Erro ao criar conta. Tente novamente.")
            setIsLoading(false)
            return
        }
        if (data.session) {
            router.push("/midia-kit/criar")
            return
        }
        setConfirm(true)
        setIsLoading(false)
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                <Link href="/midia-kit" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
                    <ArrowLeft className="h-4 w-4" /> Voltar
                </Link>

                <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-sm">
                    <CardHeader className="text-center space-y-4">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 mx-auto flex items-center justify-center shadow-lg">
                            <FileImage className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Criar Conta</CardTitle>
                            <CardDescription>Cadastre-se para criar seu mídia kit profissional</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {confirm ? (
                            <div className="text-center space-y-4 py-4">
                                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                                <p className="font-medium">Confira seu email</p>
                                <p className="text-sm text-muted-foreground">Enviamos um link de confirmação para <strong>{form.email}</strong>. Confirme para acessar o builder.</p>
                                <Link href="/login/midia-kit" className="text-emerald-500 text-sm font-medium hover:underline inline-block">Ir para o login</Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome completo</Label>
                                    <Input id="name" placeholder="Seu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="instagram">Instagram (opcional)</Label>
                                    <Input id="instagram" placeholder="@seuinstagram" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Senha</Label>
                                    <div className="relative">
                                        <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-xl pr-10" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {error && <p className="text-sm text-destructive text-center">{error}</p>}

                                <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 font-bold text-lg">
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar Conta"}
                                </Button>

                                <p className="text-center text-sm text-muted-foreground">
                                    Já tem conta? <Link href="/login/midia-kit" className="text-emerald-500 hover:underline font-medium">Fazer login</Link>
                                </p>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
