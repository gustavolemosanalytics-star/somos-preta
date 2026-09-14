"use client"

import Link from "next/link"
import {
    Building2, CheckCircle2, FileText, Megaphone, UserPlus, type LucideIcon,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

/**
 * Feed "Atividade recente" do painel.
 *
 * Lê somos_preta_atividades, alimentada por triggers — e não por chamadas
 * espalhadas pelo código, que é como um feed começa a mentir: basta alguém
 * atualizar um registro por outro caminho e a linha não aparece.
 */

export type ItemAtividade = {
    id: string
    entidade: string
    entidade_id: string | null
    tipo: string
    resumo: string
    created_at: string
    autor: { nome: string | null; email: string | null; avatar_url: string | null } | null
}

/** Ícone e cor por entidade; o tipo é fino demais para valer um mapa próprio. */
const VISUAL: Record<string, { icone: LucideIcon; cor: string }> = {
    cliente: { icone: Building2, cor: "bg-status-info/12 text-status-info" },
    campanha: { icone: Megaphone, cor: "bg-primary/12 text-primary" },
    criador: { icone: UserPlus, cor: "bg-status-sucesso/12 text-status-sucesso" },
    contrato: { icone: FileText, cor: "bg-status-atencao/12 text-status-atencao" },
    tarefa: { icone: CheckCircle2, cor: "bg-status-progresso/12 text-status-progresso" },
}

const PADRAO = { icone: CheckCircle2, cor: "bg-muted text-muted-foreground" }

/** Para onde a linha leva — null quando a entidade não tem tela própria. */
function destino(item: ItemAtividade) {
    if (!item.entidade_id) return null
    switch (item.entidade) {
        case "cliente": return `/clientes/${item.entidade_id}`
        case "campanha": return `/campanhas/${item.entidade_id}`
        case "criador": return `/criadores/${item.entidade_id}`
        case "tarefa": return `/tarefas/${item.entidade_id}`
        default: return null
    }
}

export function FeedAtividade({ itens, vazio = "Nada por aqui ainda." }: {
    itens: ItemAtividade[]
    vazio?: string
}) {
    if (itens.length === 0) {
        return <p className="py-8 text-center text-sm text-muted-foreground">{vazio}</p>
    }

    return (
        <ul className="space-y-1">
            {itens.map((item) => {
                const { icone: Icone, cor } = VISUAL[item.entidade] ?? PADRAO
                const href = destino(item)
                const autor = item.autor?.nome ?? item.autor?.email

                const linha = (
                    <>
                        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", cor)}>
                            <Icone className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm">{item.resumo}</span>
                            <span className="block text-xs text-muted-foreground">
                                {autor ? `por ${autor} · ` : ""}
                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                        </span>
                        {item.autor && (
                            <Avatar className="h-6 w-6 shrink-0">
                                {item.autor.avatar_url && <AvatarImage src={item.autor.avatar_url} alt={autor ?? ""} />}
                                <AvatarFallback className="text-[9px]">
                                    {(autor ?? "?").slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        )}
                    </>
                )

                return (
                    <li key={item.id}>
                        {href ? (
                            <Link href={href} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/50">
                                {linha}
                            </Link>
                        ) : (
                            <div className="flex items-center gap-3 p-2">{linha}</div>
                        )}
                    </li>
                )
            })}
        </ul>
    )
}
