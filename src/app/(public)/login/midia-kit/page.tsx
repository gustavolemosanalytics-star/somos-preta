"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { FileImage, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react"
import { motion } from "framer-motion"
import { mockDb } from "@/lib/mock-db"

export default function MidiaKitLoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!email || !password) {
            setError("Preencha todos os campos.")
            return
        }

        setIsLoading(true)

        try {
            const user = await mockDb.midiaKitUser.findByEmail(email)

            if (!user) {
                setError("Email não encontrado. Crie uma conta primeiro.")
                setIsLoading(false)
                return
            }

            if (user.password !== password) {
                setError("Senha incorreta.")
                setIsLoading(false)
                return
            }

            // Store session in localStorage for mock auth
            localStorage.setItem("midiakit-user", JSON.stringify({ email: user.email, name: user.name, instagram: user.instagram }))

            router.push("/midia-kit/criar")
        } catch {
            setError("Erro ao fazer login. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-background via-background to-emerald-500/5">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Link href="/midia-kit" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
                    <ArrowLeft className="h-4 w-4" /> Voltar para Mídia Kit
                </Link>

                <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-sm">
                    <CardHeader className="text-center space-y-4">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 mx-auto flex items-center justify-center shadow-lg">
                            <FileImage className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Login Mídia Kit</CardTitle>
                            <CardDescription>Acesse seu mídia kit builder</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Sua senha"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="rounded-xl pr-10"
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
                                <p className="text-sm text-destructive text-center">{error}</p>
                            )}

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 font-bold text-lg"
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                Não tem conta?{" "}
                                <Link href="/midia-kit/registro" className="text-emerald-500 hover:underline font-medium">
                                    Criar conta
                                </Link>
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
