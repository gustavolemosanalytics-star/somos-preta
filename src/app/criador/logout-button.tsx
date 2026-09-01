"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function LogoutButton() {
    const router = useRouter()
    const [supabase] = useState(() => createClient())
    const [isLoading, setIsLoading] = useState(false)

    async function sair() {
        setIsLoading(true)
        await supabase.auth.signOut()
        router.push("/criador/login")
        router.refresh()
    }

    return (
        <Button variant="outline" size="sm" onClick={sair} disabled={isLoading} className="rounded-xl">
            <LogOut className="h-4 w-4" />
            Sair
        </Button>
    )
}
