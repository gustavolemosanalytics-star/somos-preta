"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { FileImage, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react"
import { motion } from "framer-motion"
import { creatorAreaPath } from "@/lib/creator-route"

export default function MidiaKitLoginPage() {
    const router = useRouter()
    const [supabase] = useState(() => createClient())
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [form, setForm] = useState({ email: "", password: "" })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
        if (error) {
            setError(error.message.includes("Invalid") ? "Email ou senha inválidos." : error.message.includes("confirm") ? "Confirme seu email antes de entrar." : "Não foi possível entrar.")
            setIsLoading(false)
            return
        }
        router.push(await creatorAreaPath(supabase))
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
                            <CardTitle className="text-2xl">Entrar</CardTitle>
                            <CardDescription>Acesse para criar ou editar seu mídia kit</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <div className="relative">
                                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Sua senha" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-xl pr-10" required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && <p className="text-sm text-destructive text-center">{error}</p>}

                            <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 font-bold text-lg">
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                Não tem conta? <Link href="/criador/criar-conta" className="text-emerald-500 hover:underline font-medium">Criar agora</Link>
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
