"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
    Building2, ChevronRight, ExternalLink, FileText, Loader2, MapPin, Megaphone,
    Paperclip, Plus, Send, StickyNote, Tag, Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { CAMPANHA_STATUS, CLIENTE_STATUS } from "@/lib/constants/campanhas"
import { TAREFA_STATUS } from "@/lib/constants/tarefas"
import { dataCurta } from "@/lib/constants/blog"
import { createClient } from "@/lib/supabase/client"
import type { ClienteNota, TarefaStatus } from "@/lib/db/types"
import { cn } from "@/lib/utils"
import type { CampanhaResumo, ClienteDaLista, TarefaResumo } from "./tipos"

type Aba = "acoes" | "campanhas" | "tarefas" | "arquivos" | "notas"

/** Período legível de uma campanha ("Jan – Mar 2026"). */
function periodo(c: CampanhaResumo) {
    const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
    const fmt = (iso: string | null) => {
        if (!iso) return null
        const d = new Date(iso)
        return `${meses[d.getMonth()]} ${d.getFullYear()}`
    }
    const de = fmt(c.data_inicio)
    const ate = fmt(c.data_fim)
    if (de && ate) return `${de} – ${ate}`
    return de ?? ate ?? "Sem período"
}

/**
 * Painel de detalhe do cliente selecionado.
 *
 * Fica abaixo da tabela, e não numa rota própria, porque o trabalho da tela é
 * comparar contas e mergulhar numa sem perder a lista de vista — que é
 * exatamente o que /clientes/[id] tirava de quem estava triando.
 */
export function PainelCliente({
    cliente, campanhas, tarefas, onEditarTarefa,
}: {
    cliente: ClienteDaLista
    campanhas: CampanhaResumo[]
    tarefas: TarefaResumo[]
    onEditarTarefa: (id: string, status: TarefaStatus) => void
}) {
    const [supabase] = useState(() => createClient())
    const [aba, setAba] = useState<Aba>("acoes")
    const [notas, setNotas] = useState<ClienteNota[]>([])
    const [novaNota, setNovaNota] = useState("")
    const [salvandoNota, setSalvandoNota] = useState(false)

    useEffect(() => {
        setAba("acoes")
        setNovaNota("")
        let vivo = true
        supabase
            .from("somos_preta_cliente_notas")
            .select("*")
            .eq("cliente_id", cliente.id)
            .order("created_at", { ascending: false })
            .then(({ data, error }) => {
                if (!vivo || error) return
                setNotas((data as ClienteNota[]) ?? [])
            })
        return () => { vivo = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cliente.id])

    async function adicionarNota() {
        if (!novaNota.trim()) return
        setSalvandoNota(true)
        const { data: { user } } = await supabase.auth.getUser()
        const { data, error } = await supabase
            .from("somos_preta_cliente_notas")
            .insert({ cliente_id: cliente.id, conteudo: novaNota.trim(), autor_id: user?.id ?? null })
            .select("*")
            .single()
        setSalvandoNota(false)
        if (error || !data) { toast.error("Não foi possível salvar a nota"); return }
        setNotas((n) => [data as ClienteNota, ...n])
        setNovaNota("")
        toast.success("Nota adicionada")
    }

    async function removerNota(id: string) {
        const { error } = await supabase.from("somos_preta_cliente_notas").delete().eq("id", id)
        if (error) { toast.error("Não foi possível remover"); return }
        setNotas((n) => n.filter((x) => x.id !== id))
    }

    // Próximas ações: o que ainda não fechou, do mais urgente para o menos.
    const proximasAcoes = tarefas
        .filter((t) => t.status !== "cancelada")
        .slice()
        .sort((a, b) => (a.data_entrega ?? "9999").localeCompare(b.data_entrega ?? "9999"))
        .slice(0, 6)

    const meta = CLIENTE_STATUS[cliente.status]

    // Sem cliente_id em somos_preta_mensagens, o botão faz o honesto: abre o
    // canal que existe de fato no cadastro.
    const contato = cliente.email
        ? `mailto:${cliente.email}`
        : cliente.telefone
            ? `https://wa.me/${cliente.telefone.replace(/\D/g, "")}`
            : null

    const abas: { id: Aba; label: string; n?: number }[] = [
        { id: "acoes", label: "Próximas ações" },
        { id: "campanhas", label: "Campanhas", n: campanhas.length },
        { id: "tarefas", label: "Tarefas", n: tarefas.length },
        { id: "arquivos", label: "Arquivos" },
        { id: "notas", label: "Notas", n: notas.length },
    ]

    return (
        <Card className="rounded-2xl">
            <CardContent className="grid gap-6 p-4 sm:p-5 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(0,280px)]">
                {/* ---------- identidade ---------- */}
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        {cliente.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cliente.logo_url} alt="" className="h-12 w-12 shrink-0 rounded-xl bg-muted object-contain" />
                        ) : (
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                <Building2 className="h-5 w-5" />
                            </span>
                        )}
                        <div className="min-w-0">
                            <p className="truncate text-lg font-semibold leading-tight">{cliente.nome}</p>
                            {cliente.empresa && (
                                <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">{cliente.empresa}</p>
                            )}
                            <Badge variant="secondary" className={cn("mt-2 gap-1.5", meta.className)}>
                                <span className={cn("h-1.5 w-1.5 rounded-full", meta.ponto)} aria-hidden />
                                {meta.label}
                            </Badge>
                        </div>
                    </div>

                    {cliente.observacoes && (
                        <p className="text-sm leading-relaxed text-muted-foreground">{cliente.observacoes}</p>
                    )}

                    <dl className="space-y-2 text-sm">
                        {cliente.segmento && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Tag className="h-4 w-4 shrink-0" aria-hidden />
                                <span>{cliente.segmento}</span>
                            </div>
                        )}
                        {(cliente.cidade || cliente.estado) && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                                <span>{[cliente.cidade, cliente.estado].filter(Boolean).join(" / ")}</span>
                            </div>
                        )}
                        {cliente.site && (
                            <a
                                href={cliente.site}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-primary hover:underline"
                            >
                                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                                <span className="truncate">{cliente.site.replace(/^https?:\/\//, "")}</span>
                            </a>
                        )}
                    </dl>

                    {(cliente.contato_nome || cliente.email || cliente.telefone) && (
                        <div className="rounded-xl border p-3">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pessoa de contato</p>
                            <div className="mt-2 flex items-center gap-2">
                                <Avatar className="h-9 w-9">
                                    {cliente.contato_avatar_url && <AvatarImage src={cliente.contato_avatar_url} alt="" />}
                                    <AvatarFallback className="text-[10px]">
                                        {(cliente.contato_nome ?? cliente.nome).slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 leading-tight">
                                    <p className="truncate text-sm font-medium">{cliente.contato_nome ?? "Contato principal"}</p>
                                    {cliente.contato_cargo && (
                                        <p className="truncate text-xs text-muted-foreground">{cliente.contato_cargo}</p>
                                    )}
                                </div>
                            </div>
                            {contato && (
                                <Button asChild variant="outline" size="sm" className="mt-3 w-full rounded-xl">
                                    <a href={contato} target="_blank" rel="noopener noreferrer">
                                        <Send className="h-3.5 w-3.5" /> Enviar mensagem
                                    </a>
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* ---------- abas ---------- */}
                <div className="min-w-0">
                    <div className="flex flex-wrap gap-1 border-b">
                        {abas.map((a) => (
                            <button
                                key={a.id}
                                type="button"
                                onClick={() => setAba(a.id)}
                                aria-current={aba === a.id ? "true" : undefined}
                                className={cn(
                                    "h-auto min-h-0 border-b-2 px-3 py-2 text-sm transition-colors",
                                    aba === a.id
                                        ? "border-primary font-medium text-foreground"
                                        : "border-transparent text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {a.label}{a.n !== undefined ? ` (${a.n})` : ""}
                            </button>
                        ))}
                    </div>

                    <div className="pt-3">
                        {aba === "acoes" && (
                            proximasAcoes.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    Nenhuma tarefa aberta para este cliente.
                                </p>
                            ) : (
                                <ul className="space-y-1">
                                    {proximasAcoes.map((t) => {
                                        const feita = t.status === "concluida"
                                        return (
                                            <li key={t.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50">
                                                <Checkbox
                                                    checked={feita}
                                                    onCheckedChange={() => onEditarTarefa(t.id, feita ? "a_fazer" : "concluida")}
                                                    aria-label={`Concluir ${t.titulo}`}
                                                    className="min-h-0 min-w-0"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className={cn("truncate text-sm", feita && "text-muted-foreground line-through")}>
                                                        {t.titulo}
                                                    </p>
                                                    {t.data_entrega && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {dataCurta(t.data_entrega)}
                                                            {t.horario ? ` • ${t.horario.slice(0, 5)}` : ""}
                                                        </p>
                                                    )}
                                                </div>
                                                <Badge variant="secondary" className={TAREFA_STATUS[t.status].className}>
                                                    {TAREFA_STATUS[t.status].label}
                                                </Badge>
                                                <Link href={`/tarefas/${t.id}`} aria-label={`Abrir ${t.titulo}`}>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )
                        )}

                        {aba === "campanhas" && (
                            campanhas.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma campanha para este cliente.</p>
                            ) : (
                                <ul className="space-y-1">
                                    {campanhas.map((c) => (
                                        <li key={c.id}>
                                            <Link href={`/campanhas/${c.id}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50">
                                                <Megaphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                <span className="min-w-0 flex-1 truncate text-sm">{c.nome}</span>
                                                <Badge variant="secondary" className={CAMPANHA_STATUS[c.status].className}>
                                                    {CAMPANHA_STATUS[c.status].label}
                                                </Badge>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )
                        )}

                        {aba === "tarefas" && (
                            tarefas.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma tarefa vinculada.</p>
                            ) : (
                                <ul className="space-y-1">
                                    {tarefas.map((t) => (
                                        <li key={t.id}>
                                            <Link href={`/tarefas/${t.id}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50">
                                                <span className="min-w-0 flex-1 truncate text-sm">{t.titulo}</span>
                                                <Badge variant="secondary" className={TAREFA_STATUS[t.status].className}>
                                                    {TAREFA_STATUS[t.status].label}
                                                </Badge>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )
                        )}

                        {aba === "arquivos" && (
                            <div className="py-8 text-center">
                                <Paperclip className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                                <p className="text-sm font-medium">Nenhum arquivo ainda</p>
                                <p className="text-xs text-muted-foreground">
                                    O bucket &quot;clientes&quot; já existe; o envio entra na próxima passada.
                                </p>
                            </div>
                        )}

                        {aba === "notas" && (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Textarea
                                        value={novaNota}
                                        onChange={(e) => setNovaNota(e.target.value)}
                                        placeholder="Anote algo sobre esta conta..."
                                        className="min-h-[60px]"
                                        aria-label="Nova nota"
                                    />
                                    <Button
                                        size="sm"
                                        className="rounded-xl"
                                        disabled={salvandoNota || !novaNota.trim()}
                                        onClick={adicionarNota}
                                    >
                                        {salvandoNota ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {notas.length === 0 ? (
                                    <p className="py-6 text-center text-sm text-muted-foreground">
                                        <StickyNote className="mx-auto mb-2 h-6 w-6 opacity-40" />
                                        Nenhuma nota ainda.
                                    </p>
                                ) : (
                                    <ul className="space-y-2">
                                        {notas.map((n) => (
                                            <li key={n.id} className="group flex items-start gap-2 rounded-xl border p-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="whitespace-pre-wrap text-sm">{n.conteudo}</p>
                                                    <p className="mt-1 text-xs text-muted-foreground">{dataCurta(n.created_at)}</p>
                                                </div>
                                                <Button
                                                    variant="ghost" size="icon-sm"
                                                    className="text-muted-foreground hover:text-destructive"
                                                    onClick={() => removerNota(n.id)}
                                                    aria-label="Remover nota"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ---------- campanhas em destaque ---------- */}
                <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">Campanhas em destaque</p>
                        <Link href="/campanhas" className="text-xs font-medium text-primary hover:underline">Ver todas</Link>
                    </div>

                    {campanhas.length === 0 ? (
                        <p className="py-6 text-xs text-muted-foreground">Nenhuma campanha para destacar.</p>
                    ) : (
                        <ul className="mt-3 space-y-2">
                            {campanhas.slice(0, 3).map((c) => (
                                <li key={c.id}>
                                    <Link href={`/campanhas/${c.id}`} className="flex items-center gap-3 rounded-xl border p-2 transition-colors hover:border-primary/40">
                                        {c.capa_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={c.capa_url} alt="" className="h-10 w-10 shrink-0 rounded-lg bg-muted object-cover" />
                                        ) : (
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                                <FileText className="h-4 w-4" />
                                            </span>
                                        )}
                                        <span className="min-w-0 flex-1 leading-tight">
                                            <span className="block truncate text-sm font-medium">{c.nome}</span>
                                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <span className={cn("h-1.5 w-1.5 rounded-full", CLIENTE_STATUS.ativo.ponto)} aria-hidden />
                                                {CAMPANHA_STATUS[c.status].label}
                                            </span>
                                            <span className="block text-xs text-muted-foreground">{periodo(c)}</span>
                                        </span>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
