"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

export function CopyLinkButton({ path }: { path: string }) {
    async function copiar() {
        await navigator.clipboard.writeText(`${window.location.origin}${path}`)
        toast.success("Link copiado")
    }

    return (
        <Button variant="outline" size="sm" onClick={copiar} className="rounded-xl">
            <Copy className="h-4 w-4" />
            Copiar link
        </Button>
    )
}
