"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

/**
 * Botão de sair da área do criador.
 *
 * Aceita aparência própria porque ele aparece em dois lugares que não se
 * parecem em nada: solto numa tela clara e dentro da barra lateral escura. Sem
 * as props, a barra precisaria de um segundo botão só para mudar de cor — e aí
 * seriam duas cópias da mesma lógica de encerrar sessão para manter em dia.
 */
export function LogoutButton({
    className,
    icone,
    children,
}: {
    className?: string
    icone?: React.ReactNode
    children?: React.ReactNode
}) {
    const router = useRouter()
    const [supabase] = useState(() => createClient())
    const [saindo, setSaindo] = useState(false)

    async function sair() {
        setSaindo(true)
        await supabase.auth.signOut()
        router.push("/creator/login")
        router.refresh()
    }

    if (className) {
        return (
            <button type="button" onClick={sair} disabled={saindo} className={className}>
                {icone}
                {children}
            </button>
        )
    }

    return (
        <Button variant="outline" size="sm" onClick={sair} disabled={saindo} className="rounded-xl">
            <LogOut className="h-4 w-4" />
            Sair
        </Button>
    )
}
