"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type Pessoa = { nome?: string | null; email?: string | null; avatar_url?: string | null }

/**
 * Avatares sobrepostos com "+N" — o rodapé do card de campanha e a coluna de
 * equipe das tabelas.
 *
 * O anel usa a cor do card (bg-card) e não branco: sobre o fundo off-white do
 * tema um anel branco some, e no escuro viraria um halo.
 */
export function PilhaAvatares({ pessoas, max = 3, className }: {
    pessoas: Pessoa[]
    max?: number
    className?: string
}) {
    if (pessoas.length === 0) return null

    const visiveis = pessoas.slice(0, max)
    const resto = pessoas.length - visiveis.length

    return (
        <div className={cn("flex items-center -space-x-2", className)}>
            {visiveis.map((p, i) => {
                const nome = p.nome ?? p.email ?? "?"
                return (
                    <Avatar key={i} className="h-7 w-7 ring-2 ring-card">
                        {p.avatar_url && <AvatarImage src={p.avatar_url} alt={nome} />}
                        <AvatarFallback className="text-[10px]">{nome.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                )
            })}
            {resto > 0 && (
                <span className="flex h-7 items-center rounded-full bg-muted px-2 text-[11px] font-medium text-muted-foreground ring-2 ring-card">
                    +{resto}
                </span>
            )}
        </div>
    )
}
