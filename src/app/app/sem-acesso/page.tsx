"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"

export default function SemAcessoPage() {
    const router = useRouter()

    async function sair() {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push("/app/login")
        router.refresh()
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0d0d14] p-4">
            <div className="w-full max-w-md text-center space-y-6">
                <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
                    <ShieldAlert className="h-7 w-7 text-white/70" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold text-white">Sua conta ainda não tem acesso</h1>
                    <p className="text-white/50 text-sm leading-relaxed">
                        Um administrador precisa liberar seu acesso e definir seu papel na tela de
                        <strong className="text-white/70"> Usuários</strong>. Assim que isso for feito, você entra no sistema.
                    </p>
                </div>
                <Button onClick={sair} variant="outline" className="rounded-xl border-white/15 text-white hover:bg-white/5">
                    Sair
                </Button>
            </div>
        </div>
    )
}
