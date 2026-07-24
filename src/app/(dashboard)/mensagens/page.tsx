"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Mensagem } from "@/lib/db/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { MessageSquare, Send, Plus, Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

type Contato = { nome: string; ultima: string; quando: string; naoLidas: number }

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()

export default function MessagesPage() {
    const [supabase] = useState(() => createClient())
    const [mensagens, setMensagens] = useState<Mensagem[]>([])
    const [loading, setLoading] = useState(true)
    const [ativo, setAtivo] = useState<string | null>(null)
    const [texto, setTexto] = useState("")
    const [novoOpen, setNovoOpen] = useState(false)
    const [novoNome, setNovoNome] = useState("")
    const endRef = useRef<HTMLDivElement>(null)

    async function load() {
        const { data } = await supabase.from("somos_preta_mensagens").select("*").order("created_at")
        setMensagens((data as Mensagem[]) ?? [])
        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const contatos = useMemo<Contato[]>(() => {
        const map = new Map<string, Contato>()
        for (const m of mensagens) {
            const c = map.get(m.contato_nome) ?? { nome: m.contato_nome, ultima: "", quando: "", naoLidas: 0 }
            c.ultima = m.conteudo
            c.quando = m.created_at
            if (!m.lida && m.origem === "contato") c.naoLidas += 1
            map.set(m.contato_nome, c)
        }
        return [...map.values()].sort((a, b) => (a.quando < b.quando ? 1 : -1))
    }, [mensagens])

    const thread = useMemo(
        () => mensagens.filter((m) => m.contato_nome === ativo),
        [mensagens, ativo]
    )

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [thread.length, ativo])

    async function abrir(nome: string) {
        setAtivo(nome)
        // marca as recebidas como lidas
        const naoLidas = mensagens.some((m) => m.contato_nome === nome && !m.lida && m.origem === "contato")
        if (naoLidas) {
            await supabase.from("somos_preta_mensagens").update({ lida: true }).eq("contato_nome", nome).eq("origem", "contato")
            setMensagens((prev) => prev.map((m) => m.contato_nome === nome ? { ...m, lida: true } : m))
        }
    }

    async function enviar(e: React.FormEvent) {
        e.preventDefault()
        if (!texto.trim() || !ativo) return
        const conteudo = texto.trim()
        setTexto("")
        const { data, error } = await supabase.from("somos_preta_mensagens")
            .insert({ contato_nome: ativo, conteudo, origem: "eu", lida: true })
            .select()
            .single()
        if (error) { toast.error("Erro ao enviar"); return }
        setMensagens((prev) => [...prev, data as Mensagem])
    }

    function novaConversa(e: React.FormEvent) {
        e.preventDefault()
        if (!novoNome.trim()) return
        setAtivo(novoNome.trim())
        setNovoNome("")
        setNovoOpen(false)
    }

    if (loading) {
        return <div className="flex items-center justify-center py-24 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><MessageSquare className="h-6 w-6 text-primary" /> Mensagens</h1>
                <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
                    <DialogTrigger asChild><Button className="rounded-xl"><Plus className="h-4 w-4" /> Nova conversa</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-sm">
                        <form onSubmit={novaConversa}>
                            <DialogHeader><DialogTitle>Nova conversa</DialogTitle></DialogHeader>
                            <div className="py-4">
                                <Input placeholder="Nome do contato" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} autoFocus />
                            </div>
                            <DialogFooter><Button type="submit" className="rounded-xl">Abrir</Button></DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="grid md:grid-cols-[300px_1fr] overflow-hidden h-[calc(100vh-220px)] min-h-[420px]">
                {/* lista de contatos */}
                <div className={`border-r overflow-y-auto ${ativo ? "hidden md:block" : "block"}`}>
                    {contatos.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma conversa. Clique em “Nova conversa”.</div>
                    ) : contatos.map((c) => (
                        <button key={c.nome} onClick={() => abrir(c.nome)}
                            className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 border-b transition-colors ${ativo === c.nome ? "bg-muted/60" : ""}`}>
                            <Avatar className="h-10 w-10"><AvatarFallback>{initials(c.nome)}</AvatarFallback></Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{c.nome}</p>
                                <p className="text-xs text-muted-foreground truncate">{c.ultima}</p>
                            </div>
                            {c.naoLidas > 0 && <Badge className="bg-primary h-5 min-w-5 px-1.5 text-[10px]">{c.naoLidas}</Badge>}
                        </button>
                    ))}
                </div>

                {/* thread */}
                <div className={`flex flex-col ${ativo ? "flex" : "hidden md:flex"}`}>
                    {!ativo ? (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Selecione uma conversa</div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 p-3 border-b">
                                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setAtivo(null)}><ArrowLeft className="h-4 w-4" /></Button>
                                <Avatar className="h-9 w-9"><AvatarFallback>{initials(ativo)}</AvatarFallback></Avatar>
                                <p className="font-semibold">{ativo}</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/20">
                                {thread.map((m) => (
                                    <div key={m.id} className={`flex ${m.origem === "eu" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.origem === "eu" ? "bg-primary text-primary-foreground" : "bg-card border"}`}>
                                            {m.conteudo}
                                        </div>
                                    </div>
                                ))}
                                {thread.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">Nenhuma mensagem ainda. Diga olá 👋</p>}
                                <div ref={endRef} />
                            </div>
                            <form onSubmit={enviar} className="flex items-center gap-2 p-3 border-t">
                                <Input placeholder="Escreva uma mensagem..." value={texto} onChange={(e) => setTexto(e.target.value)} className="rounded-full" />
                                <Button type="submit" size="icon" className="rounded-full shrink-0"><Send className="h-4 w-4" /></Button>
                            </form>
                        </>
                    )}
                </div>
            </Card>
        </div>
    )
}
