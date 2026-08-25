"use client"

import { useMemo, useRef, useState } from "react"
import { useProfiles } from "@/hooks/use-profiles"
import { Textarea } from "@/components/ui/textarea"
import { UserAvatar } from "./user-picker"

const MENTION_TOKEN = /@\[([^\]]+)\]\(([0-9a-f-]{36})\)/g
const MENTION_DIGITANDO = /(?:^|\s)@([a-zA-Z0-9À-ÿ]*)$/

export function extrairMencoes(texto: string): string[] {
    const ids = new Set<string>()
    for (const m of texto.matchAll(MENTION_TOKEN)) ids.add(m[2])
    return Array.from(ids)
}

export function renderizarMencoes(texto: string) {
    const partes: Array<{ tipo: "texto"; valor: string } | { tipo: "mencao"; nome: string }> = []
    let last = 0
    for (const m of texto.matchAll(MENTION_TOKEN)) {
        if (m.index! > last) partes.push({ tipo: "texto", valor: texto.slice(last, m.index) })
        partes.push({ tipo: "mencao", nome: m[1] })
        last = m.index! + m[0].length
    }
    if (last < texto.length) partes.push({ tipo: "texto", valor: texto.slice(last) })
    return partes
}

export function MentionTextarea({ value, onChange, placeholder, rows = 3 }: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
    rows?: number
}) {
    const { profiles } = useProfiles()
    const [busca, setBusca] = useState<string | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        const v = e.target.value
        onChange(v)
        const antesDoCursor = v.slice(0, e.target.selectionStart ?? v.length)
        const match = antesDoCursor.match(MENTION_DIGITANDO)
        setBusca(match ? match[1] : null)
    }

    const sugestoes = useMemo(() => {
        if (busca === null) return []
        const q = busca.toLowerCase()
        return profiles.filter((p) => (p.nome ?? p.email ?? "").toLowerCase().includes(q)).slice(0, 6)
    }, [busca, profiles])

    function escolher(p: { id: string; nome: string | null; email: string | null }) {
        const nome = p.nome ?? p.email ?? "usuário"
        const match = value.match(MENTION_DIGITANDO)
        if (!match) { setBusca(null); return }
        const idx = value.lastIndexOf(match[0])
        const prefixo = match[0].startsWith(" ") ? " " : ""
        const inserido = prefixo + `@[${nome}](${p.id}) `
        const novo = value.slice(0, idx) + inserido + value.slice(idx + match[0].length)
        const novaPosicaoCursor = idx + inserido.length
        onChange(novo)
        setBusca(null)
        requestAnimationFrame(() => {
            const el = textareaRef.current
            if (!el) return
            el.focus()
            el.setSelectionRange(novaPosicaoCursor, novaPosicaoCursor)
        })
    }

    return (
        <div className="relative">
            <Textarea ref={textareaRef} rows={rows} placeholder={placeholder} value={value} onChange={handleChange} />
            {busca !== null && sugestoes.length > 0 && (
                <div className="absolute z-20 mt-1 w-64 rounded-md border bg-popover shadow-md py-1">
                    {sugestoes.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => escolher(p)}
                            className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent text-left"
                        >
                            <UserAvatar profile={p} />
                            {p.nome ?? p.email}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export function TextoComMencoes({ texto }: { texto: string }) {
    return (
        <>
            {renderizarMencoes(texto).map((parte, i) =>
                parte.tipo === "mencao" ? (
                    <span key={i} className="text-primary font-medium">@{parte.nome}</span>
                ) : (
                    <span key={i}>{parte.valor}</span>
                )
            )}
        </>
    )
}
