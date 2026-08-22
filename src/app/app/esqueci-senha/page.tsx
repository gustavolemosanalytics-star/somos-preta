"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react"

export default function EsqueciSenhaPage() {
    const [supabase] = useState(() => createClient())
    const [isLoading, setIsLoading] = useState(false)
    const [done, setDone] = useState(false)
    const [email, setEmail] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/app/redefinir-senha`,
        })

        // Sempre mostramos o mesmo estado de sucesso, exista ou não a conta,
        // para não vazar quais emails estão cadastrados.
        if (error) {
            toast.error("Não foi possível enviar o email agora. Tente novamente.")
            setIsLoading(false)
            return
        }

        toast.success("Enviamos um link de redefinição para o seu email.")
        setDone(true)
        setIsLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0d0d14] p-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">Somos Preta</h1>
                    <p className="text-white/50 text-sm">Recuperar acesso</p>
                </div>

                {done ? (
                    <div className="text-center space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6">
                        <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                        <p className="text-white font-medium">Confira seu email</p>
                        <p className="text-white/50 text-sm">
                            Se houver uma conta associada a <strong>{email}</strong>, enviamos um link
                            para você redefinir sua senha.
                        </p>
                        <Link href="/app/login" className="text-primary text-sm font-medium hover:underline inline-block">
                            Voltar para o login
                        </Link>
                    </div>
                ) : (
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

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar link de redefinição"}
                        </Button>
                    </form>
                )}

                {!done && (
                    <p className="text-center text-white/50 text-sm">
                        <Link href="/app/login" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
                            <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
                        </Link>
                    </p>
                )}
            </div>
        </div>
    )
}
