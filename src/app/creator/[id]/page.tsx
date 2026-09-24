import Link from "next/link"
import { ArrowRight, ArrowUpRight, Check, Plus } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/supabase/auth"
import { cn } from "@/lib/utils"
import type { MidiaKit } from "@/lib/db/types"
import {
    REDES_CONFIG, normalizarHandle, percentualPronto,
    type Pacote, type PortfolioItem, type RedeInfo,
} from "@/lib/constants/media-kit"
import { UFS } from "@/lib/constants/uf"

/**
 * Meu perfil — a primeira tela da área do criador.
 *
 * Tudo aqui sai do Media Kit: não existe cadastro de perfil separado no banco,
 * e inventar um só para esta tela criaria dois lugares para editar o mesmo
 * nome. Por isso o subtítulo diz que os dados alimentam o Mídia Kit: é
 * literalmente a mesma linha da tabela.
 */

const NOME_DA_REGIAO: Record<string, string> = {
    N: "Norte", NE: "Nordeste", CO: "Centro-Oeste", SE: "Sudeste", S: "Sul",
}

/**
 * "Salvador, Bahia" e não "Salvador, BA".
 *
 * O editor guarda a sigla, que é o formato do resto do produto, mas numa
 * apresentação de perfil o nome por extenso lê melhor. A conversão é só de
 * exibição: o banco continua com a sigla.
 */
function localizacao(kit: MidiaKit | null) {
    const uf = UFS.find((u) => u.sigla === (kit?.estado ?? "").trim().toUpperCase())
    const partes = [kit?.cidade?.trim(), uf?.nome ?? kit?.estado?.trim()].filter(Boolean)
    return {
        texto: partes.length ? partes.join(", ") : null,
        regiao: uf ? NOME_DA_REGIAO[uf.regiao] : null,
    }
}

/** "Instagram, TikTok e YouTube" — o "e" só antes do último. */
function listar(nomes: string[]) {
    if (nomes.length <= 1) return nomes[0] ?? ""
    return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`
}

export default async function MeuPerfilPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const profile = await getProfile()
    const supabase = await createClient()

    const { data: kit } = await supabase
        .from("somos_preta_midia_kits")
        .select("*")
        .eq("cadastrado_por", id)
        .maybeSingle<MidiaKit>()

    const primeiroNome = (kit?.nome || profile?.nome || "").split(" ")[0]
    const redes = (kit?.redes ?? {}) as Record<string, RedeInfo>
    const arroba = normalizarHandle(redes.instagram?.handle ?? "")
    const nichos = kit?.nichos ?? []

    const conectadas = REDES_CONFIG.filter((r) => Boolean(redes[r.chave]?.handle))
    const disponiveis = REDES_CONFIG.filter((r) => !redes[r.chave]?.handle)

    const dados = {
        publicado: kit?.publicado ?? false,
        nome: kit?.nome,
        bio: kit?.bio,
        avatar_url: kit?.avatar_url,
        cover_url: kit?.cover_url,
        cidade: kit?.cidade,
        estado: kit?.estado,
        whatsapp: kit?.whatsapp,
        nichos: kit?.nichos,
        redes,
        portfolio: (Array.isArray(kit?.portfolio) ? kit?.portfolio : []) as PortfolioItem[],
        pacotes: (Array.isArray(kit?.pacotes) ? kit?.pacotes : []) as Pacote[],
    }
    const completude = kit ? percentualPronto(dados) : 0

    // O checklist da direita é o mesmo raciocínio do percentual, só que em
    // linguagem de perfil em vez de linguagem de kit.
    const etapasDoPerfil = [
        { rotulo: "Informações pessoais", ok: Boolean(kit?.nome?.trim() && kit?.cidade?.trim()) },
        { rotulo: "Foto e apresentação", ok: Boolean(kit?.avatar_url && kit?.bio?.trim()) },
        { rotulo: "Instagram conectado", ok: Boolean(redes.instagram?.handle) },
        { rotulo: "Adicionar mais uma rede", ok: conectadas.length > 1 },
    ]

    const local = localizacao(kit)
    const editar = `/creator/${id}/midia-kit/editar`

    return (
        <div className="space-y-6">
            {/* ---------- abertura ---------- */}
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-terracota-texto">
                        Meu perfil
                    </p>
                    <h1 className="mt-3 text-[clamp(2.1rem,4.4vw,3.2rem)] font-extrabold leading-[1.05] tracking-[-0.035em]">
                        {primeiroNome ? `Olá, ${primeiroNome}` : "Olá"}{" "}
                        <span aria-hidden>👋</span>
                    </h1>
                    <p className="mt-2 text-[15px] text-muted-foreground">
                        Seus dados alimentam automaticamente o seu Mídia Kit.
                    </p>
                </div>

                <Link
                    href={editar}
                    className="inline-flex h-12 shrink-0 items-center rounded-2xl bg-white px-6 text-sm font-bold shadow-[0_2px_10px_-4px_rgba(31,31,31,0.18)] transition-colors hover:bg-brand-areia/50"
                >
                    Editar meus dados
                </Link>
            </header>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)]">
                {/* ---------- cartão do perfil ---------- */}
                <section className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-7">
                    <span
                        aria-hidden
                        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-terracota/[0.07]"
                    />

                    <div className="relative flex flex-wrap items-start gap-5">
                        <span className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-brand-areia">
                            {kit?.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={kit.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <span className="flex h-full w-full items-center justify-center text-xl font-bold text-muted-foreground">
                                    {(kit?.nome || profile?.nome || "?").slice(0, 2).toUpperCase()}
                                </span>
                            )}
                        </span>

                        <div className="min-w-0 flex-1">
                            <h2 className="truncate text-2xl font-extrabold tracking-[-0.02em]">
                                {kit?.nome || profile?.nome || "Seu nome"}
                            </h2>
                            <p className="mt-1 truncate text-[15px] text-muted-foreground">
                                {arroba ? `@${arroba}` : "Sem @ cadastrado"}
                                {local.texto ? ` • ${local.texto}` : ""}
                            </p>

                            <span
                                className={cn(
                                    "mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold",
                                    kit?.publicado
                                        ? "bg-status-sucesso/12 text-status-sucesso"
                                        : "bg-status-neutro/12 text-status-neutro",
                                )}
                            >
                                {kit?.publicado && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
                                {kit?.publicado ? "Perfil publicado" : "Perfil em rascunho"}
                            </span>
                        </div>

                        {kit?.publicado && kit.slug && (
                            <Link
                                href={`/kit/${kit.slug}`}
                                target="_blank"
                                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-brand-terracota/12 px-4 text-[13px] font-semibold text-brand-terracota-texto transition-colors hover:bg-brand-terracota/20"
                            >
                                Ver perfil público
                                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                            </Link>
                        )}
                    </div>

                    <div className="relative mt-6 grid gap-6 border-t border-brand-areia pt-6 sm:grid-cols-2">
                        <Bloco titulo="Apresentação">
                            {kit?.bio?.trim() ? (
                                <p className="text-[15px] leading-relaxed">{kit.bio}</p>
                            ) : (
                                <Vazio href={editar}>Escreva sua apresentação</Vazio>
                            )}
                        </Bloco>

                        <Bloco titulo="Nichos">
                            {nichos.length > 0 ? (
                                <ul className="flex flex-wrap gap-2">
                                    {nichos.map((n) => (
                                        <li
                                            key={n}
                                            className="rounded-full bg-brand-terracota/12 px-3.5 py-1.5 text-[13px] font-semibold text-brand-terracota-texto"
                                        >
                                            {n}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <Vazio href={editar}>Escolha seus nichos</Vazio>
                            )}
                        </Bloco>

                        <Bloco titulo="Redes conectadas">
                            {conectadas.length > 0 ? (
                                <p className="text-[15px] leading-relaxed">
                                    <strong className="font-bold">{listar(conectadas.map((r) => r.label))}</strong>{" "}
                                    {conectadas.length > 1 ? "conectadas" : "conectado"}
                                    {disponiveis.length > 0 && (
                                        <span className="text-muted-foreground">
                                            {" "}
                                            • {listar(disponiveis.map((r) => r.label))}{" "}
                                            {disponiveis.length > 1 ? "disponíveis" : "disponível"}
                                        </span>
                                    )}
                                </p>
                            ) : (
                                <Vazio href={editar}>Conecte sua primeira rede</Vazio>
                            )}
                        </Bloco>

                        <Bloco titulo="Localização">
                            {local.texto ? (
                                <p className="text-[15px] leading-relaxed">
                                    {local.texto}
                                    {local.regiao && (
                                        <span className="text-muted-foreground"> • {local.regiao}</span>
                                    )}
                                </p>
                            ) : (
                                <Vazio href={editar}>Informe sua cidade</Vazio>
                            )}
                        </Bloco>
                    </div>
                </section>

                {/* ---------- completude ---------- */}
                <section className="rounded-3xl bg-brand-carvao p-6 text-white sm:p-7">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-terracota">
                        Completude do perfil
                    </p>

                    <p className="mt-3 text-[clamp(2.6rem,5vw,3.6rem)] font-extrabold leading-none tracking-[-0.04em] text-brand-terracota tabular-nums">
                        {completude}%
                    </p>

                    <p className="mt-4 text-[15px] leading-relaxed text-white/70">
                        {completude >= 80
                            ? "Seu perfil já tem as informações necessárias para um ótimo Mídia Kit."
                            : "Complete os itens abaixo para o seu Mídia Kit convencer mais rápido."}
                    </p>

                    <div
                        role="progressbar"
                        aria-valuenow={completude}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Completude do perfil"
                        className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/12"
                    >
                        <span
                            className="block h-full rounded-full bg-brand-terracota"
                            style={{ width: `${completude}%` }}
                        />
                    </div>

                    <ul className="mt-6 space-y-3">
                        {etapasDoPerfil.map((e) => (
                            <li key={e.rotulo} className="flex items-center gap-2.5">
                                <span
                                    aria-hidden
                                    className={cn(
                                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                                        e.ok ? "bg-status-sucesso text-white" : "bg-white/12 text-white/60",
                                    )}
                                >
                                    {e.ok ? (
                                        <Check className="h-3 w-3" strokeWidth={3.5} />
                                    ) : (
                                        <Plus className="h-3 w-3" strokeWidth={3} />
                                    )}
                                </span>
                                <span className={cn("text-sm", e.ok ? "text-white" : "text-white/60")}>
                                    {e.rotulo}
                                </span>
                                <span className="sr-only">{e.ok ? "concluído" : "pendente"}</span>
                            </li>
                        ))}
                    </ul>

                    <Link
                        href={editar}
                        className="mt-7 flex h-13 w-full items-center justify-center rounded-2xl bg-white/10 text-sm font-bold text-white transition-colors hover:bg-white/15"
                    >
                        Completar perfil
                    </Link>
                </section>
            </div>

            {/* ---------- faixa do mídia kit ---------- */}
            <section className="relative overflow-hidden rounded-3xl bg-brand-terracota px-6 py-7 text-white sm:px-8">
                <span
                    aria-hidden
                    className="pointer-events-none absolute -right-4 -top-6 select-none text-[11rem] font-extrabold leading-none text-white/[0.08]"
                >
                    M
                </span>

                <div className="relative flex flex-wrap items-center justify-between gap-5">
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                            Meu Mídia Kit
                        </p>
                        <h2 className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-extrabold leading-tight tracking-[-0.025em]">
                            {kit?.publicado ? "Publicado e atualizado" : "Ainda não publicado"}
                        </h2>
                        <p className="mt-1.5 text-[15px] text-white/80">
                            {kit?.publicado
                                ? `Última atualização: ${quando(kit.updated_at)}`
                                : "Termine de montar e publique para receber o link."}
                            {conectadas.length > 0 && ` • ${listar(conectadas.map((r) => r.label))} conectado`}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {kit?.publicado && kit.slug && (
                            <Link
                                href={`/kit/${kit.slug}`}
                                target="_blank"
                                className="inline-flex h-12 items-center rounded-2xl bg-white/90 px-6 text-sm font-bold text-brand-carvao transition-colors hover:bg-white"
                            >
                                Ver página pública
                            </Link>
                        )}
                        <Link
                            href={`/creator/${id}/midia-kit`}
                            className="group inline-flex h-12 items-center gap-2 rounded-2xl bg-brand-carvao px-6 text-sm font-bold text-white transition-colors hover:bg-brand-carvao/85"
                        >
                            Acessar meu Mídia Kit
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{titulo}</p>
            <div className="mt-2.5">{children}</div>
        </div>
    )
}

function Vazio({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-[15px] font-medium text-brand-terracota-texto hover:underline"
        >
            <Plus className="h-4 w-4" aria-hidden />
            {children}
        </Link>
    )
}

/** Data curta em português, sem depender de biblioteca. */
function quando(iso: string | null | undefined) {
    if (!iso) return "ainda não salva"
    const data = new Date(iso)
    if (Number.isNaN(data.getTime())) return "ainda não salva"

    const hoje = new Date()
    const mesmoDia =
        data.getDate() === hoje.getDate() &&
        data.getMonth() === hoje.getMonth() &&
        data.getFullYear() === hoje.getFullYear()

    const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    if (mesmoDia) return `hoje, às ${hora}`

    return `${data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, às ${hora}`
}
