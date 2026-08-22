"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff, ShieldAlert } from "lucide-react"

export default function RedefinirSenhaPage() {
    const router = useRouter()
    const [supabase] = useState(() => createClient())
    const [checkingSession, setCheckingSession] = useState(true)
    const [hasRecoverySession, setHasRecoverySession] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    useEffect(() => {
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "PASSWORD_RECOVERY" && session) {
                setHasRecoverySession(true)
                setCheckingSession(false)
            }
        })

        // Supabase JS v2 processa o token de recuperação da URL automaticamente
        // ao carregar a página. Também checamos a sessão diretamente, caso o
        // evento PASSWORD_RECOVERY já tenha disparado antes deste efeito montar.
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setHasRecoverySession(true)
            setCheckingSession(false)
        })

        return () => {
            listener.subscription.unsubscribe()
        }
    }, [supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (password.length < 6) {
            setError("A senha precisa ter pelo menos 6 caracteres")
            return
        }
        if (password !== confirmPassword) {
            setError("As senhas não coincidem")
            return
        }

        setIsLoading(true)
        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            setError("Não foi possível redefinir sua senha. Tente novamente.")
            setIsLoading(false)
            return
        }

        toast.success("Senha redefinida com sucesso.")
        router.push("/app/login")
    }

    if (checkingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0d0d14] p-4">
                <Loader2 className="h-6 w-6 animate-spin text-white/50" />
            </div>
        )
    }

    if (!hasRecoverySession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0d0d14] p-4">
                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-white mb-2">Somos Preta</h1>
                        <p className="text-white/50 text-sm">Redefinir senha</p>
                    </div>
                    <div className="text-center space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6">
                        <ShieldAlert className="h-12 w-12 text-red-400 mx-auto" />
                        <p className="text-white font-medium">Link inválido ou expirado</p>
                        <p className="text-white/50 text-sm">
                            Solicite um novo link para redefinir sua senha.
                        </p>
                        <Link href="/app/esqueci-senha" className="text-primary text-sm font-medium hover:underline inline-block">
                            Esqueci minha senha
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0d0d14] p-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">Somos Preta</h1>
                    <p className="text-white/50 text-sm">Defina sua nova senha</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-white/70">Nova senha</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-primary focus:ring-primary pr-10"
                                required
                                minLength={6}
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
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-white/70">Confirmar senha</Label>
                        <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="repita a nova senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-primary focus:ring-primary"
                            required
                            minLength={6}
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
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Redefinir senha"}
                    </Button>
                </form>
            </div>
        </div>
    )
}
