"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { confirmarEscrita, lidos } from "@/lib/supabase/resultado"
import type { Mensagem } from "@/lib/db/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ErroDeCarregamento } from "@/components/painel/erro-de-carregamento"
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MessageSquare, Send, Plus, Loader2, ArrowLeft, Trash2 } from "lucide-react"
import { toast } from "sonner"

type Contato = { nome: string; ultima: string; quando: string; naoLidas: number; rascunho?: boolean }

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
// a conversa é derivada de contato_nome: comparar sem caixa nem espaço impede um rascunho paralelo a um histórico existente
const chave = (n: string) => n.trim().toLowerCase()

export default function MessagesPage() {
    const [supabase] = useState(() => createClient())
    const [mensagens, setMensagens] = useState<Mensagem[]>([])
    const [loading, setLoading] = useState(true)
    const [erroCarga, setErroCarga] = useState(false)
    const [ativo, setAtivo] = useState<string | null>(null)
    // conversa aberta que ainda não existe no banco: vive só nesta sessão, até a primeira mensagem
    const [rascunho, setRascunho] = useState<string | null>(null)
    const [texto, setTexto] = useState("")
    const [enviando, setEnviando] = useState(false)
    const [novoOpen, setNovoOpen] = useState(false)
    const [novoNome, setNovoNome] = useState("")
    const [excluirOpen, setExcluirOpen] = useState(false)
    const [excluindo, setExcluindo] = useState(false)
    const endRef = useRef<HTMLDivElement>(null)

    async function load() {
        setLoading(true)
        setErroCarga(false)
        try {
            // Descendente com limite: o PostgREST corta a resposta num teto de linhas,
            // e cortar pelas mais antigas faria sumir justamente as conversas de agora.
            const linhas = lidos<Mensagem>(
                await supabase
                    .from("somos_preta_mensagens")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .limit(500)
            )
            if (!linhas) {
                setErroCarga(true)
                return
            }
            // o resto da tela (última mensagem do contato, ordem da thread) lê do mais antigo para o mais novo
            setMensagens([...linhas].reverse())
        } catch {
            setErroCarga(true)
        } finally {
            setLoading(false)
        }
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

    const listaContatos = useMemo<Contato[]>(
        () => (rascunho ? [{ nome: rascunho, ultima: "", quando: "", naoLidas: 0, rascunho: true }, ...contatos] : contatos),
        [contatos, rascunho]
    )

    const thread = useMemo(
        () => mensagens.filter((m) => m.contato_nome === ativo),
        [mensagens, ativo]
    )

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [thread.length, ativo])

    async function abrir(nome: string) {
        setAtivo(nome)
        setRascunho((r) => (r === nome ? r : null))
        // marca as recebidas como lidas
        const naoLidas = mensagens.some((m) => m.contato_nome === nome && !m.lida && m.origem === "contato")
        if (!naoLidas) return
        const ok = await confirmarEscrita(
            supabase.from("somos_preta_mensagens")
                .update({ lida: true })
                .eq("contato_nome", nome)
                .eq("origem", "contato")
                .select("id"),
            "Não foi possível marcar as mensagens como lidas",
        )
        if (!ok) return
        // mesmo filtro do UPDATE: as mensagens próprias já nascem lidas e não entram na conta
        setMensagens((prev) => prev.map((m) => m.contato_nome === nome && m.origem === "contato" ? { ...m, lida: true } : m))
    }

    async function enviar(e: React.FormEvent) {
        e.preventDefault()
        const conteudo = texto.trim()
        if (!conteudo || !ativo || enviando) return
        setEnviando(true)
        const { data, error } = await supabase.from("somos_preta_mensagens")
            .insert({ contato_nome: ativo, conteudo, origem: "eu", lida: true })
            .select()
            .single()
        setEnviando(false)
        if (error || !data) {
            toast.error("Não foi possível enviar a mensagem")
            return
        }
        setMensagens((prev) => [...prev, data as Mensagem])
        setRascunho((r) => (r === ativo ? null : r))
        // só limpa o campo depois de gravar: no erro o que foi escrito continua ali para reenviar
        setTexto("")
    }

    async function excluirConversa() {
        if (!ativo) return
        setExcluindo(true)
        const ok = await confirmarEscrita(
            supabase.from("somos_preta_mensagens").delete().eq("contato_nome", ativo).select("id"),
            "Não foi possível excluir a conversa",
        )
        setExcluindo(false)
        if (!ok) return
        toast.success("Conversa excluída")
        setMensagens((prev) => prev.filter((m) => m.contato_nome !== ativo))
        setExcluirOpen(false)
        setAtivo(null)
    }

    function novaConversa(e: React.FormEvent) {
        e.preventDefault()
        const nome = novoNome.trim()
        if (!nome) return
        const existente = contatos.find((c) => chave(c.nome) === chave(nome))
        if (existente) {
            // nome com histórico não vira rascunho: abre a conversa que existe, com a grafia já gravada
            abrir(existente.nome)
        } else {
            setRascunho(nome)
            setAtivo(nome)
        }
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
                                <Input placeholder="Nome do contato" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} required autoFocus />
                            </div>
                            <DialogFooter><Button type="submit" className="rounded-xl" disabled={!novoNome.trim()}>Abrir</Button></DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {erroCarga ? (
                <ErroDeCarregamento recurso="as conversas" onTentarDeNovo={load} />
            ) : (
                <Card className="grid md:grid-cols-[300px_1fr] overflow-hidden h-[calc(100vh-220px)] min-h-[420px]">
                    {/* lista de contatos */}
                    <div className={`border-r overflow-y-auto ${ativo ? "hidden md:block" : "block"}`}>
                        {listaContatos.length === 0 ? (
                            <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma conversa. Clique em “Nova conversa”.</div>
                        ) : listaContatos.map((c) => (
                            <button key={c.nome} onClick={() => abrir(c.nome)}
                                className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 border-b transition-colors ${ativo === c.nome ? "bg-muted/60" : ""}`}>
                                <Avatar className="h-10 w-10"><AvatarFallback>{initials(c.nome)}</AvatarFallback></Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{c.nome}</p>
                                    <p className="text-xs text-muted-foreground truncate">{c.rascunho ? "Ainda sem mensagens" : c.ultima}</p>
                                </div>
                                {c.rascunho && <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-muted-foreground">rascunho</Badge>}
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
                                    {thread.length > 0 && (
                                        <AlertDialog open={excluirOpen} onOpenChange={setExcluirOpen}>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-destructive hover:text-destructive" aria-label="Excluir conversa"><Trash2 className="h-4 w-4" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
                                                    <AlertDialogDescription>Esta ação não pode ser desfeita. As {thread.length} mensagens trocadas com &quot;{ativo}&quot; serão removidas permanentemente.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel disabled={excluindo} className="rounded-xl">Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={(e) => { e.preventDefault(); excluirConversa() }} disabled={excluindo} className="rounded-xl bg-destructive text-white hover:bg-destructive/90">
                                                        {excluindo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/20">
                                    {thread.map((m) => (
                                        <div key={m.id} className={`flex ${m.origem === "eu" ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.origem === "eu" ? "bg-primary text-primary-foreground" : "bg-card border"}`}>
                                                {m.conteudo}
                                            </div>
                                        </div>
                                    ))}
                                    {thread.length === 0 && (
                                        <div className="py-8 space-y-1 text-center text-xs text-muted-foreground">
                                            <p>Nenhuma mensagem ainda. Diga olá 👋</p>
                                            <p>Esta conversa só passa a existir quando a primeira mensagem for enviada. Se você abrir outra conversa ou recarregar a página antes disso, o rascunho é descartado.</p>
                                        </div>
                                    )}
                                    <div ref={endRef} />
                                </div>
                                <form onSubmit={enviar} className="flex items-center gap-2 p-3 border-t">
                                    <Input placeholder="Escreva uma mensagem..." value={texto} onChange={(e) => setTexto(e.target.value)} className="rounded-full" />
                                    <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!texto.trim() || enviando}>
                                        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </form>
                            </>
                        )}
                    </div>
                </Card>
            )}
        </div>
    )
}
