"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

export function CopyLinkButton({ path }: { path: string }) {
    async function copiar() {
        const url = `${window.location.origin}${path}`
        try {
            await navigator.clipboard.writeText(url)
            toast.success("Link copiado")
        } catch {
            // A promessa do clipboard rejeita em contexto não-seguro (preview
            // por IP, http), com a permissão negada, e no Safari quando o gesto
            // não é reconhecido. Sem o catch a rejeição ficava sem tratamento e
            // o toast de sucesso nunca rodava: o botão simplesmente não fazia
            // nada, e a criadora clicava de novo achando que tinha errado a mira.
            toast.error("Não consegui copiar — selecione o link e copie na mão")
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={copiar} className="rounded-xl">
            <Copy className="h-4 w-4" />
            Copiar link
        </Button>
    )
}
