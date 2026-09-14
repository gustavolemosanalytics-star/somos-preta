"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { EngajamentoHero } from "./engajamento-hero"

/**
 * Dobra do checador de engajamento na home.
 *
 * Aqui o envio não consulta a API: leva para /engajamento com o @ na URL, onde
 * o resultado tem espaço para ser lido. A tela então dispara a análise sozinha.
 */
export function EngajamentoDobra() {
    const router = useRouter()
    const [valor, setValor] = useState("")

    const ir = (e: React.FormEvent) => {
        e.preventDefault()
        const alvo = valor.trim().replace(/^@/, "")
        router.push(alvo ? `/engajamento?perfil=${encodeURIComponent(alvo)}` : "/engajamento")
    }

    return (
        <div id="engajamento" className="scroll-mt-24 border-t border-border">
            <EngajamentoHero valor={valor} onChange={setValor} onSubmit={ir} compacta />
        </div>
    )
}
