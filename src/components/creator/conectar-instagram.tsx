"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, BadgeCheck, Check, Instagram, Loader2, Lock, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
    MENSAGEM_DO_RETORNO, MENSAGEM_DO_STATUS, numeroCompacto, percentual,
    type ConexaoInstagram, type MetricasInstagram, type StatusInstagram,
} from "@/lib/instagram/tipos"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

/**
 * "Conectar com Instagram" — a criadora entra com a própria conta e autoriza.
 *
 * Não existe mais campo de @: consultar perfil de terceiros é contra as regras
 * da Meta, e só o login dá acesso ao que a marca quer ver (alcance,
 * visualizações, salvamentos, audiência). O botão leva a /api/instagram/login,
 * que manda para o diálogo da Meta e volta para ESTA tela com
 * ?instagram=<resultado> — que o componente transforma em aviso.
 *
 * O componente não grava nada no banco sozinho. "Atualizar" chama
 * /api/instagram/sincronizar; o editor injeta a própria versão (`sincronizar`)
 * para a chamada entrar na fila de escrita dele.
 */

export type RespostaSincronizacao = {
    ok: boolean
    status?: StatusInstagram
    mensagem?: string
    metricas?: MetricasInstagram | null
    redes?: Record<string, unknown> | null
    preenchido?: { avatar_url?: string; bio?: string }
    doCache?: boolean
}

export async function chamarSincronizacao(): Promise<RespostaSincronizacao> {
    try {
        const res = await fetch("/api/instagram/sincronizar", { method: "POST" })
        return ((await res.json().catch(() => null)) as RespostaSincronizacao | null) ?? { ok: false, mensagem: "Não consegui falar com o servidor agora." }
    } catch {
        return { ok: false, mensagem: "Sem conexão. Confira a internet e tente de novo." }
    }
}

const O_QUE_VEM = [
    "Seguidores e crescimento",
    "Alcance e visualizações",
    "Engajamento real por post",
    "Quem é sua audiência",
]

function haQuanto(iso: string | null | undefined) {
    if (!iso) return null
    const min = Math.round((Date.now() - Date.parse(iso)) / 60_000)
    if (Number.isNaN(min)) return null
    if (min < 1) return "agora mesmo"
    if (min < 60) return `há ${min} min`
    const h = Math.round(min / 60)
    if (h < 24) return `há ${h} h`
    const d = Math.round(h / 24)
    return d === 1 ? "ontem" : `há ${d} dias`
}

export function ConectarInstagram({
    conexao: conexaoInicial,
    metricas,
    sincronizar,
    onDesconectado,
    variante = "cartao",
    className,
}: {
    /** `undefined` = o componente busca sozinho (telas de cliente, como o editor). */
    conexao?: ConexaoInstagram | null
    metricas: MetricasInstagram | null
    sincronizar?: () => Promise<RespostaSincronizacao>
    onDesconectado?: () => void
    /** "destaque" é o convite grande do perfil; "cartao", o do editor e das métricas. */
    variante?: "cartao" | "destaque"
    className?: string
}) {
    const router = useRouter()
    const caminho = usePathname()
    const params = useSearchParams()
    const [conexao, setConexao] = useState<ConexaoInstagram | null | undefined>(conexaoInicial)
    const [ocupado, setOcupado] = useState<"atualizando" | "desconectando" | null>(null)
    const [confirmando, setConfirmando] = useState(false)

    // Sem a conexão vinda do servidor, pergunta uma vez.
    useEffect(() => {
        if (conexaoInicial !== undefined) return
        let vivo = true
        fetch("/api/instagram/conexao")
            .then((r) => r.json())
            .then((j) => vivo && setConexao((j?.conexao as ConexaoInstagram | null) ?? null))
            .catch(() => vivo && setConexao(null))
        return () => {
            vivo = false
        }
    }, [conexaoInicial])

    // A volta do login da Meta chega como ?instagram=<resultado>: vira aviso e
    // sai da URL, para um F5 não repetir a mensagem.
    const avisou = useRef(false)
    useEffect(() => {
        const resultado = params.get("instagram")
        if (!resultado || avisou.current) return
        avisou.current = true
        const aviso = MENSAGEM_DO_RETORNO[resultado] ?? MENSAGEM_DO_RETORNO.erro
        if (aviso.ok) toast.success(aviso.texto)
        else toast.error(aviso.texto)
        const limpa = new URLSearchParams(params.toString())
        limpa.delete("instagram")
        const consulta = limpa.toString()
        window.history.replaceState(null, "", consulta ? `${caminho}?${consulta}` : caminho)
    }, [params, caminho])

    const voltar = (() => {
        const limpa = new URLSearchParams(params.toString())
        limpa.delete("instagram")
        const consulta = limpa.toString()
        return consulta ? `${caminho}?${consulta}` : caminho
    })()
    const urlDeLogin = `/api/instagram/login?voltar=${encodeURIComponent(voltar)}`

    const revogada = conexao?.status === "revogada" || metricas?.status === "token"
    const conectado = Boolean(conexao) && !revogada
    const falhaRecente = metricas && metricas.status !== "ok" && metricas.status !== "token" ? metricas.status : null
    const destaque = variante === "destaque"

    async function atualizar() {
        setOcupado("atualizando")
        const r = await (sincronizar ?? chamarSincronizacao)()
        setOcupado(null)
        if (r.ok && r.metricas) {
            toast.success(r.doCache ? "Seus números já estão em dia." : "Números atualizados.")
        } else {
            toast.error(r.mensagem ?? "Não deu certo agora. Tente de novo.")
        }
        if (!sincronizar) router.refresh()
    }

    async function desconectar() {
        setConfirmando(false)
        setOcupado("desconectando")
        const res = await fetch("/api/instagram/conexao", { method: "DELETE" }).catch(() => null)
        setOcupado(null)
        if (!res?.ok) {
            toast.error("Não consegui desconectar agora.")
            return
        }
        setConexao(null)
        toast.success("Instagram desconectado e dados apagados.")
        onDesconectado?.()
        router.refresh()
    }

    const botaoConectar = (rotulo: string) => (
        <a
            href={urlDeLogin}
            className="inline-flex h-12 items-center justify-center gap-2.5 rounded-2xl bg-[linear-gradient(135deg,#F58529,#DD2A7B_55%,#8134AF)] px-6 text-sm font-bold text-white shadow-[0_14px_30px_-14px_#DD2A7B] transition-transform hover:-translate-y-0.5"
        >
            <Instagram className="h-4.5 w-4.5" aria-hidden /> {rotulo}
        </a>
    )

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-3xl",
                destaque ? "bg-brand-carvao p-6 text-white sm:p-8" : "border border-border bg-card p-5 sm:p-6",
                className,
            )}
        >
            {destaque && (
                <>
                    <span aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#DD2A7B]/35 blur-3xl" />
                    <span aria-hidden className="pointer-events-none absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-[#F58529]/30 blur-3xl" />
                </>
            )}

            <div className="relative">
                {/* ---------- cabeçalho ---------- */}
                <div className="flex items-start gap-3">
                    <span
                        aria-hidden
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#F58529,#DD2A7B_55%,#8134AF)] text-white shadow-lg"
                    >
                        <Instagram className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className={cn("font-bold tracking-tight", destaque ? "text-xl sm:text-2xl" : "text-[15px]")}>
                            {conectado ? "Instagram conectado" : revogada ? "Reconecte seu Instagram" : "Conecte seu Instagram"}
                        </p>
                        <p className={cn("mt-1 text-[13px] leading-relaxed", destaque ? "text-white/65" : "text-muted-foreground")}>
                            {conectado
                                ? "Seus números vêm direto da sua conta e são atualizados todo dia."
                                : revogada
                                    ? MENSAGEM_DO_STATUS.token
                                    : "Entre com a sua conta e seu Mídia Kit ganha números oficiais do Instagram — os mesmos que você vê no painel profissional do app."}
                        </p>
                    </div>
                    {conectado && (
                        <span className="hidden shrink-0 items-center gap-1 rounded-full bg-status-sucesso/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-status-sucesso sm:inline-flex">
                            <BadgeCheck className="h-3 w-3" aria-hidden /> Oficial
                        </span>
                    )}
                </div>

                {/* ---------- ainda não conectado ---------- */}
                {conexao !== undefined && !conectado && (
                    <div className="mt-5">
                        {!revogada && (
                            <ul className="mb-5 grid gap-2 sm:grid-cols-2">
                                {O_QUE_VEM.map((item) => (
                                    <li key={item} className={cn("flex items-center gap-2 text-[13px]", destaque ? "text-white/80" : "text-foreground")}>
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-status-sucesso/20 text-status-sucesso">
                                            <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {botaoConectar(revogada ? "Reconectar com Instagram" : "Conectar com Instagram")}
                        <p className={cn("mt-4 flex items-start gap-2 text-xs leading-relaxed", destaque ? "text-white/50" : "text-muted-foreground")}>
                            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                            O login acontece na Meta — a Somos Preta nunca vê sua senha. Precisa ser conta profissional
                            (Criador de conteúdo ou Comercial). Você desconecta quando quiser e os dados são apagados.
                        </p>
                    </div>
                )}

                {conexao === undefined && (
                    <p className={cn("mt-5 flex items-center gap-2 text-sm", destaque ? "text-white/60" : "text-muted-foreground")}>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Verificando sua conexão…
                    </p>
                )}

                {/* ---------- conectado ---------- */}
                {conectado && (
                    <div className="mt-5">
                        <div className={cn("flex items-center gap-3 rounded-2xl p-3", destaque ? "bg-white/[0.06]" : "bg-muted/60")}>
                            {metricas?.foto_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={metricas.foto_url} alt="" className="h-11 w-11 rounded-full object-cover" />
                            ) : (
                                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-terracota/20 text-sm font-bold">
                                    {(conexao?.username ?? "?").slice(0, 1).toUpperCase()}
                                </span>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold">@{metricas?.username ?? conexao?.username}</p>
                                <p className={cn("text-xs", destaque ? "text-white/55" : "text-muted-foreground")}>
                                    {metricas ? `Atualizado ${haQuanto(metricas.atualizado_em) ?? "—"}` : "Buscando seus números…"}
                                </p>
                            </div>
                        </div>

                        {metricas && (
                            <dl className="mt-3 grid grid-cols-3 gap-2">
                                {[
                                    { rotulo: "Seguidores", valor: numeroCompacto(metricas.seguidores) },
                                    { rotulo: "Alcance 30d", valor: numeroCompacto(metricas.insights_30d?.alcance) },
                                    { rotulo: "Engajamento", valor: percentual(metricas.taxa_engajamento) },
                                ].map((m) => (
                                    <div key={m.rotulo} className={cn("rounded-2xl px-3 py-3", destaque ? "bg-white/[0.06]" : "bg-muted/60")}>
                                        <dt className={cn("text-[11px]", destaque ? "text-white/55" : "text-muted-foreground")}>{m.rotulo}</dt>
                                        <dd className="mt-0.5 text-lg font-extrabold tracking-tight tabular-nums">{m.valor}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}

                        {falhaRecente && (
                            <p className="mt-3 flex items-start gap-2 rounded-2xl bg-status-atencao/15 px-3.5 py-2.5 text-[13px] leading-relaxed">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-atencao" aria-hidden />
                                A última atualização não deu certo: {MENSAGEM_DO_STATUS[falhaRecente].toLowerCase()} Os números acima são os da coleta anterior.
                            </p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                disabled={ocupado !== null}
                                onClick={atualizar}
                                className={cn(
                                    "inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-colors disabled:opacity-60",
                                    destaque ? "bg-white text-brand-carvao hover:bg-white/90" : "bg-brand-carvao text-white hover:bg-brand-carvao/90",
                                )}
                            >
                                {ocupado === "atualizando" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
                                {ocupado === "atualizando" ? "Buscando no Instagram…" : "Atualizar agora"}
                            </button>
                            <button
                                type="button"
                                disabled={ocupado !== null}
                                onClick={() => setConfirmando(true)}
                                className={cn("ml-auto h-10 rounded-full px-3 text-[12px] underline-offset-4 hover:underline", destaque ? "text-white/45" : "text-muted-foreground")}
                            >
                                {ocupado === "desconectando" ? "Desconectando…" : "Desconectar"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Desconectar o Instagram?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apagamos o acesso, o histórico de métricas e os números do seu Mídia Kit. Para tirar a
                            permissão também do lado da Meta, remova a Somos Preta em Configurações do Instagram →
                            Apps e sites (ou Integrações do seu portfólio empresarial).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={desconectar}>Desconectar e apagar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
