"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, BadgeCheck, Check, CircleDashed, Copy, Instagram, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { SITE_URL } from "@/lib/constants/site"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Integração Instagram (login da criadora) — o cartão de Configurações.
 *
 * Existe para a equipe responder sozinha às perguntas que aparecem quando os
 * números param de atualizar: o app da Meta está configurado? o segredo
 * confere? quantas criadoras conectaram e quantas perderam o acesso? a rotina
 * diária está ligada? Sem este cartão, a única forma de saber era o log.
 *
 * Também guarda os três endereços que precisam ser colados no painel do app
 * da Meta — errar um caractere no de redirecionamento derruba o login inteiro.
 */

type Status = {
    app: {
        configurado: boolean
        versao: string
        faltando: string[]
        app: { id: string; nome: string | null } | null
        erro: string | null
    }
    rotina: boolean
    redirecionamento: string | null
    conexoes: {
        ativas: number | null
        revogadas: number | null
        com_erro: number | null
        atualizadas_24h: number | null
    }
}

type ResumoLote = {
    ok: boolean
    processados?: number
    atualizados?: number
    falhas?: string[]
    interrompido?: string | null
    mensagem?: string
    erro?: string
}

const VARIAVEIS = [
    { nome: "META_APP_ID", obrigatoria: true, uso: "ID do app da Meta" },
    { nome: "META_APP_SECRET", obrigatoria: true, uso: "chave secreta do app (assina as chamadas e os callbacks)" },
    { nome: "INSTAGRAM_LOGIN_CONFIG_ID", obrigatoria: true, uso: "a configuração do login, que define as permissões pedidas" },
    { nome: "INSTAGRAM_TOKEN_SECRET", obrigatoria: true, uso: "chave do cofre que cifra os tokens das criadoras (16+ caracteres)" },
    { nome: "INSTAGRAM_REDIRECT_URI", obrigatoria: false, uso: "só se o endereço de retorno não for o padrão abaixo" },
    { nome: "META_GRAPH_VERSION", obrigatoria: false, uso: "padrão v27.0" },
    { nome: "CRON_SECRET", obrigatoria: false, uso: "liga a atualização diária automática" },
]

const MOTIVO_DA_PARADA: Record<string, string> = {
    limite: "a Meta pediu para desacelerar",
    nao_configurado: "a integração não está configurada",
    permissao: "o app não tem a permissão pedida",
}

// O painel roda num subdomínio próprio: os callbacks moram no site principal,
// por isso o endereço vem de SITE_URL e não de window.location.
const URL_PADRAO_DE_RETORNO = `${SITE_URL}/api/instagram/callback`

export function InstagramIntegracao() {
    const [status, setStatus] = useState<Status | null>(null)
    const [falhou, setFalhou] = useState(false)
    const [carregando, setCarregando] = useState(true)
    const [rodando, setRodando] = useState(false)
    const [resumo, setResumo] = useState<ResumoLote | null>(null)

    const carregar = useCallback(async () => {
        setCarregando(true)
        setFalhou(false)
        try {
            const res = await fetch("/api/painel/meta/status", { cache: "no-store" })
            if (!res.ok) throw new Error(String(res.status))
            setStatus((await res.json()) as Status)
        } catch {
            setFalhou(true)
        } finally {
            setCarregando(false)
        }
    }, [])

    useEffect(() => {
        void carregar()
    }, [carregar])

    async function rodarLote() {
        setRodando(true)
        setResumo(null)
        try {
            const res = await fetch("/api/painel/instagram/lote", { method: "POST" })
            const json = (await res.json().catch(() => null)) as ResumoLote | null
            if (!res.ok || !json?.ok) {
                toast.error(json?.mensagem || json?.erro || "Não consegui rodar a atualização agora")
            } else {
                setResumo(json)
                toast.success(`${json.atualizados ?? 0} conta(s) atualizada(s)`)
            }
        } catch {
            toast.error("Não consegui falar com o servidor")
        } finally {
            setRodando(false)
            void carregar()
        }
    }

    const configurado = status?.app.configurado ?? false
    const conectado = configurado && Boolean(status?.app.app) && !status?.app.erro
    const semMigration = status !== null && status.conexoes.ativas === null

    return (
        <Card>
            <CardContent className="space-y-5 p-5">
                {/* ---------- cabeçalho ---------- */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#F58529,#DD2A7B_55%,#8134AF)] text-white">
                            <Instagram className="h-5 w-5" />
                        </span>
                        <div>
                            <h2 className="font-semibold">Integração Instagram</h2>
                            <p className="text-sm text-muted-foreground">
                                Cada criadora conecta a própria conta pela área dela; a plataforma lê os números com a
                                autorização que ela deu. Não existe mais busca por @.
                            </p>
                        </div>
                    </div>
                    {status && (
                        <Badge
                            variant="secondary"
                            className={cn(
                                conectado
                                    ? "bg-status-sucesso/12 text-status-sucesso"
                                    : configurado
                                        ? "bg-status-atencao/15 text-status-atencao"
                                        : "bg-muted text-muted-foreground",
                            )}
                        >
                            {conectado ? <BadgeCheck className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
                            {conectado ? "App conectado" : configurado ? "App com erro" : "Não configurado"}
                        </Badge>
                    )}
                </div>

                {carregando && !status && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Conferindo a integração…
                    </div>
                )}

                {falhou && (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-status-erro/30 bg-status-erro/5 px-4 py-3 text-sm">
                        <span>Não consegui ler o estado da integração.</span>
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => void carregar()}>
                            Tentar de novo
                        </Button>
                    </div>
                )}

                {status && (
                    <>
                        {/* ---------- app ---------- */}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Item rotulo="App da Meta">
                                {status.app.app ? (
                                    <span>
                                        {status.app.app.nome ?? "Sem nome"}{" "}
                                        <span className="text-muted-foreground">· ID {status.app.app.id}</span>
                                    </span>
                                ) : status.app.erro ? (
                                    <span className="text-status-erro">{status.app.erro}</span>
                                ) : (
                                    <span className="text-muted-foreground">—</span>
                                )}
                            </Item>
                            <Item rotulo="Versão da Graph API">{status.app.versao}</Item>
                            <Item rotulo="Atualização diária">
                                {status.rotina ? (
                                    <span className="text-status-sucesso">Ligada · todo dia às 6h (Brasília)</span>
                                ) : (
                                    <span className="text-status-atencao">Desligada — defina CRON_SECRET</span>
                                )}
                            </Item>
                            <Item rotulo="Endereço de retorno em uso">
                                <code className="break-all text-xs">{status.redirecionamento ?? URL_PADRAO_DE_RETORNO}</code>
                            </Item>
                        </div>

                        {/* ---------- conexões ---------- */}
                        {semMigration ? (
                            <div className="flex items-start gap-2 rounded-xl border border-status-atencao/30 bg-status-atencao/10 px-4 py-3 text-sm">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-atencao" />
                                <span>
                                    A tabela de conexões ainda não existe: aplique a migration{" "}
                                    <code className="text-xs">0025_instagram_login_criadora.sql</code> no SQL Editor do Supabase.
                                </span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <Numero rotulo="Contas conectadas" valor={status.conexoes.ativas} />
                                <Numero rotulo="Atualizadas em 24h" valor={status.conexoes.atualizadas_24h} />
                                <Numero rotulo="Acesso revogado" valor={status.conexoes.revogadas} alerta={(status.conexoes.revogadas ?? 0) > 0} />
                                <Numero rotulo="Com erro" valor={status.conexoes.com_erro} alerta={(status.conexoes.com_erro ?? 0) > 0} />
                            </div>
                        )}

                        {/* ---------- endereços para o painel da Meta ---------- */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Cole no painel do app da Meta
                            </p>
                            <Endereco rotulo="URI de redirecionamento do OAuth" valor={status.redirecionamento ?? URL_PADRAO_DE_RETORNO} />
                            <Endereco rotulo="URL de cancelamento de autorização" valor={`${SITE_URL}/api/instagram/desautorizar`} />
                            <Endereco rotulo="URL de solicitação de exclusão de dados" valor={`${SITE_URL}/api/instagram/exclusao-de-dados`} />
                        </div>

                        {/* ---------- variáveis ---------- */}
                        {!configurado && (
                            <div className="rounded-xl border border-border px-4 py-3 text-sm">
                                <p className="font-medium">Para ligar, defina estas variáveis de ambiente (Vercel → Settings → Environment Variables):</p>
                                <ul className="mt-2 space-y-1">
                                    {VARIAVEIS.map((v) => {
                                        const falta = status.app.faltando.includes(v.nome)
                                        return (
                                            <li key={v.nome} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                                                <code className={cn("font-semibold", falta && "text-status-erro")}>{v.nome}</code>
                                                <span className="text-muted-foreground">
                                                    {v.obrigatoria ? (falta ? "obrigatória · falta" : "obrigatória · ok") : "opcional"} — {v.uso}
                                                </span>
                                            </li>
                                        )
                                    })}
                                </ul>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    O passo a passo completo, do app à Análise do App da Meta, está em{" "}
                                    <code>docs/meta-app.md</code>.
                                </p>
                            </div>
                        )}

                        {/* ---------- atualização manual ---------- */}
                        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
                            <Button variant="outline" className="rounded-xl" onClick={() => void rodarLote()} disabled={rodando || !configurado}>
                                {rodando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                Atualizar conectadas agora
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                Mesmo trabalho da rotina diária: atualiza, em lotes, as contas há mais tempo sem coleta.
                            </p>
                        </div>

                        {resumo && (
                            <div className="rounded-xl bg-muted/60 px-4 py-3 text-sm">
                                <p>
                                    <strong>{resumo.atualizados ?? 0}</strong> de {resumo.processados ?? 0} conta(s) atualizada(s).
                                    {resumo.interrompido && (
                                        <> Parou antes do fim porque {MOTIVO_DA_PARADA[resumo.interrompido] ?? resumo.interrompido}.</>
                                    )}
                                </p>
                                {(resumo.falhas ?? []).length > 0 && (
                                    <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                                        {(resumo.falhas ?? []).slice(0, 8).map((f) => <li key={f}>{f}</li>)}
                                    </ul>
                                )}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}

function Item({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{rotulo}</p>
            <div className="mt-0.5">{children}</div>
        </div>
    )
}

function Numero({ rotulo, valor, alerta }: { rotulo: string; valor: number | null; alerta?: boolean }) {
    return (
        <div className="rounded-xl border border-border px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{rotulo}</p>
            <p className={cn("mt-0.5 text-xl font-bold tabular-nums", alerta && "text-status-atencao")}>
                {valor === null ? "—" : valor.toLocaleString("pt-BR")}
            </p>
        </div>
    )
}

/** Um endereço com botão de copiar que confirma na própria cara dele. */
function Endereco({ rotulo, valor }: { rotulo: string; valor: string }) {
    const [copiado, setCopiado] = useState(false)

    async function copiar() {
        try {
            await navigator.clipboard.writeText(valor)
            setCopiado(true)
            setTimeout(() => setCopiado(false), 1800)
        } catch {
            // A Promise do clipboard rejeita fora de contexto seguro e quando a
            // permissão é negada; anunciar sucesso ali seria mentir.
            toast.error("Não consegui copiar — selecione o endereço e copie na mão")
        }
    }

    return (
        <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
            <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground">{rotulo}</p>
                <code className="block truncate text-xs">{valor}</code>
            </div>
            <Button size="sm" variant="ghost" className="shrink-0 rounded-lg" onClick={() => void copiar()} aria-label={`Copiar ${rotulo}`}>
                {copiado ? <Check className="h-4 w-4 text-status-sucesso" /> : <Copy className="h-4 w-4" />}
            </Button>
        </div>
    )
}
