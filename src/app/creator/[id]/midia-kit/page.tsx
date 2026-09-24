import Link from "next/link"
import { ArrowRight, ArrowUpRight, FileDown, Instagram, Music2, Pencil, Youtube } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { SITE_URL } from "@/lib/constants/site"
import { cn } from "@/lib/utils"
import type { MidiaKit } from "@/lib/db/types"
import {
    ESSENCIAIS, RECOMENDADOS, normalizarHandle,
    type Pacote, type PortfolioItem, type RedeInfo,
} from "@/lib/constants/media-kit"
import { CopiarLinkDoKit } from "@/components/creator/copiar-link-do-kit"
import { DialogoQrCode } from "@/components/creator/dialogo-qrcode"

/**
 * Meu Mídia Kit — o painel do kit, separado do editor.
 *
 * O editor continua em ./editar. Esta tela é o lugar de onde se olha para o
 * kit: se está no ar, qual é o link, o que ainda dá para melhorar. Quem entra
 * aqui quase sempre quer o LINK, não o formulário.
 */

const ICONE_DA_REDE = {
    instagram: Instagram,
    tiktok: Music2,
    youtube: Youtube,
} as const

const REDES_DO_PAINEL = [
    { chave: "instagram", label: "Instagram", convite: "Conecte seu perfil" },
    { chave: "tiktok", label: "TikTok", convite: "Amplie seus dados" },
    { chave: "youtube", label: "YouTube", convite: "Adicione seu canal" },
] as const

export default async function MeuMidiaKitPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: kit } = await supabase
        .from("somos_preta_midia_kits")
        .select("*")
        .eq("cadastrado_por", id)
        .maybeSingle<MidiaKit>()

    const editar = `/creator/${id}/midia-kit/editar`
    const redes = (kit?.redes ?? {}) as Record<string, RedeInfo>

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

    const pendencias = [...ESSENCIAIS, ...RECOMENDADOS].filter((i) => !i.ok(dados))

    // Os números de acesso vivem numa tabela própria (migration 0023). Enquanto
    // ela não estiver aplicada a chamada falha, e aí os cartões dizem que ainda
    // não há medição — em vez de mostrarem zero, que seria afirmar que ninguém
    // abriu o kit.
    const { data: medidas, error: erroDasMetricas } = await supabase
        .rpc("somos_preta_midia_kit_metricas", { p_kit_id: kit?.id ?? null, p_dias: 30 })
        .maybeSingle<{
            visualizacoes: number
            cliques_contato: number
            downloads_pdf: number
            visualizacoes_antes: number
            cliques_antes: number
            downloads_antes: number
        }>()

    const medindo = Boolean(kit) && !erroDasMetricas
    const m = medidas ?? {
        visualizacoes: 0, cliques_contato: 0, downloads_pdf: 0,
        visualizacoes_antes: 0, cliques_antes: 0, downloads_antes: 0,
    }
    // Sem o esquema e sem o www: o que a criadora vai ditar ou colar numa
    // conversa é o endereço curto.
    const dominio = SITE_URL.replace(/^https?:\/\//, "").replace(/^www\./, "")
    const endereco = kit?.slug ? `${dominio}/kit/${kit.slug}` : null

    return (
        <div className="space-y-6">
            {/* ---------- abertura ---------- */}
            <header>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-terracota-texto">
                    Meu Mídia Kit
                </p>
                <h1 className="mt-3 text-[clamp(2.1rem,4.4vw,3.2rem)] font-extrabold leading-[1.05] tracking-[-0.035em]">
                    Sua apresentação para marcas
                </h1>
                <p className="mt-2 text-[15px] text-muted-foreground">
                    Gerencie o conteúdo, acompanhe o que falta e mantenha seus dados atualizados.
                </p>
            </header>

            {/* ---------- estado e link ---------- */}
            <section className="relative overflow-hidden rounded-3xl bg-brand-carvao p-6 text-white sm:p-8">
                <span
                    aria-hidden
                    className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-terracota/15 blur-3xl"
                />

                <div className="relative">
                    <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em]">
                        <span
                            aria-hidden
                            className={cn(
                                "h-2 w-2 rounded-full",
                                kit?.publicado ? "bg-status-sucesso" : "bg-white/40",
                            )}
                        />
                        {kit?.publicado ? "Publicado" : "Rascunho"}
                    </p>

                    <h2 className="mt-4 text-[clamp(1.7rem,3.6vw,2.4rem)] font-extrabold leading-tight tracking-[-0.03em]">
                        {kit?.publicado ? "Seu Mídia Kit está no ar." : "Seu Mídia Kit ainda não está no ar."}
                    </h2>

                    <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/70">
                        {kit?.publicado
                            ? "As marcas já podem conhecer seu trabalho, sua audiência e seus conteúdos."
                            : "Termine de preencher e publique para receber o link que você manda para as marcas."}
                    </p>

                    {kit?.publicado && endereco && kit.slug ? (
                        <CopiarLinkDoKit endereco={endereco} caminho={`/kit/${kit.slug}`} className="mt-6" />
                    ) : (
                        <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white/60">
                            O link aparece aqui assim que você publicar.
                        </p>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href={editar}
                            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-brand-terracota px-6 text-sm font-bold text-white transition-colors hover:bg-brand-coral"
                        >
                            <Pencil className="h-4 w-4" aria-hidden />
                            Editar Mídia Kit
                        </Link>

                        {kit?.publicado && kit.slug && (
                            <>
                                <Link
                                    href={`/kit/${kit.slug}`}
                                    target="_blank"
                                    className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/15 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10"
                                >
                                    Ver página pública
                                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                                </Link>

                                <Link
                                    href={`/kit/${kit.slug}/pdf`}
                                    target="_blank"
                                    className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/15 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10"
                                >
                                    <FileDown className="h-4 w-4" aria-hidden />
                                    Baixar PDF
                                </Link>

                                <DialogoQrCode slug={kit.slug} />
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* ---------- números ---------- */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Numero
                    rotulo="Visualizações"
                    valor={medindo ? m.visualizacoes.toLocaleString("pt-BR") : "—"}
                    nota={medindo ? variacao(m.visualizacoes, m.visualizacoes_antes) : SEM_MEDICAO}
                    boa={medindo && m.visualizacoes > m.visualizacoes_antes}
                />
                <Numero
                    rotulo="Cliques em parceria"
                    valor={medindo ? m.cliques_contato.toLocaleString("pt-BR") : "—"}
                    nota={
                        medindo
                            ? m.visualizacoes > 0
                                ? `${((m.cliques_contato / m.visualizacoes) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% dos acessos`
                                : "Ninguém clicou ainda"
                            : SEM_MEDICAO
                    }
                    boa={medindo && m.cliques_contato > 0}
                />
                <Numero
                    rotulo="Downloads do PDF"
                    valor={medindo ? m.downloads_pdf.toLocaleString("pt-BR") : "—"}
                    nota={medindo ? "Últimos 30 dias" : SEM_MEDICAO}
                    boa={medindo && m.downloads_pdf > 0}
                />
                <Numero
                    rotulo="Última atualização"
                    valor={quando(kit?.updated_at)}
                    nota={kit?.updated_at ? "Dados salvos" : "Nada salvo ainda"}
                    boa={Boolean(kit?.updated_at)}
                />
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* ---------- redes ---------- */}
                <section className="rounded-3xl bg-white p-6 sm:p-7">
                    <h2 className="text-lg font-bold tracking-tight">Redes e sincronização</h2>

                    <ul className="mt-5 divide-y divide-brand-areia">
                        {REDES_DO_PAINEL.map((rede) => {
                            const Icone = ICONE_DA_REDE[rede.chave]
                            const handle = normalizarHandle(redes[rede.chave]?.handle ?? "")

                            return (
                                <li key={rede.chave} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
                                    <span
                                        aria-hidden
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-terracota/12 text-brand-terracota-texto"
                                    >
                                        <Icone className="h-4 w-4" />
                                    </span>

                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[15px] font-semibold">{rede.label}</span>
                                        <span className="block truncate text-[13px] text-muted-foreground">
                                            {handle ? `@${handle}` : rede.convite}
                                        </span>
                                    </span>

                                    {handle ? (
                                        <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] text-status-sucesso">
                                            Conectado
                                        </span>
                                    ) : (
                                        <Link
                                            href={`${editar}?etapa=redes`}
                                            className="shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-terracota-texto hover:underline"
                                        >
                                            Conectar
                                        </Link>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </section>

                {/* ---------- melhorias ---------- */}
                <section className="flex flex-col rounded-3xl bg-white p-6 sm:p-7">
                    <h2 className="text-lg font-bold tracking-tight">Melhorias recomendadas</h2>

                    <div className="mt-5 flex-1 space-y-3">
                        {pendencias.length === 0 ? (
                            <p className="rounded-2xl bg-status-sucesso/10 px-5 py-4 text-[15px] leading-relaxed text-foreground">
                                <strong className="font-bold">Está tudo preenchido.</strong> Seu kit tem o que
                                uma marca precisa para decidir.
                            </p>
                        ) : (
                            pendencias.slice(0, 3).map((p) => (
                                <Link
                                    key={p.rotulo}
                                    href={`${editar}?etapa=${p.etapa}`}
                                    className="block rounded-2xl bg-brand-terracota/[0.09] px-5 py-4 transition-colors hover:bg-brand-terracota/15"
                                >
                                    <span className="block text-[15px] font-bold">{p.rotulo}</span>
                                    <span className="mt-1 block text-[13px] leading-relaxed text-muted-foreground">
                                        {AJUDA_DA_PENDENCIA[p.rotulo] ?? "Preencher isto deixa seu kit mais completo."}
                                    </span>
                                </Link>
                            ))
                        )}
                    </div>

                    <Link
                        href={editar}
                        className="group mt-5 flex h-13 items-center justify-center gap-2 rounded-2xl bg-brand-terracota text-sm font-bold text-white transition-colors hover:bg-brand-coral"
                    >
                        Continuar edição
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                </section>
            </div>
        </div>
    )
}

/**
 * O que os cartões dizem enquanto a tabela de eventos não existe.
 *
 * Zero seria uma afirmação: "ninguém abriu seu kit". Um traço com esta linha
 * embaixo é a verdade: ainda não estamos contando.
 */
const SEM_MEDICAO = "Medição ainda não ativada"

/** "+24% em 30 dias" — e o texto honesto quando não há com o que comparar. */
function variacao(agora: number, antes: number) {
    if (antes === 0) return agora === 0 ? "Nenhum acesso ainda" : "Primeiros 30 dias"
    const pct = Math.round(((agora - antes) / antes) * 100)
    const sinal = pct > 0 ? "+" : ""
    return `${sinal}${pct}% em 30 dias`
}

/** Por que cada pendência importa, na voz de quem vai preencher. */
const AJUDA_DA_PENDENCIA: Record<string, string> = {
    "Foto de perfil": "É a primeira coisa que a marca olha, ao lado do seu nome.",
    "Seu nome": "Como você quer ser chamada nas conversas com marcas.",
    "Uma frase sobre você": "Três linhas: quem você é, para quem fala e o que entrega.",
    "WhatsApp para contato": "É o único botão de contato da sua página. Sem ele, ninguém te responde.",
    "Pelo menos uma rede": "Número conta sua história melhor que adjetivo.",
    "Imagem de capa": "A faixa do topo da sua página, em paisagem.",
    "Cidade e estado": "Marca que busca criador de território procura por aqui.",
    "Pelo menos um nicho": "É por eles que a marca te encontra.",
    "Um trabalho no portfólio": "Marcas decidem olhando trabalho anterior. Dois ou três já resolvem.",
    "Um pacote com preço": "Dizer o preço economiza três mensagens de ida e volta.",
}

function Numero({
    rotulo,
    valor,
    nota,
    boa,
}: {
    rotulo: string
    valor: string
    nota: string
    boa: boolean
}) {
    return (
        <div className="rounded-2xl bg-white p-5">
            <p className="text-[13px] text-muted-foreground">{rotulo}</p>
            <p className="mt-1.5 text-[26px] font-extrabold leading-none tracking-[-0.03em] tabular-nums">
                {valor}
            </p>
            <p className={cn("mt-2 text-[13px]", boa ? "text-status-sucesso" : "text-muted-foreground")}>
                {nota}
            </p>
        </div>
    )
}

function quando(iso: string | null | undefined) {
    if (!iso) return "—"
    const data = new Date(iso)
    if (Number.isNaN(data.getTime())) return "—"

    const hoje = new Date()
    const mesmoDia =
        data.getDate() === hoje.getDate() &&
        data.getMonth() === hoje.getMonth() &&
        data.getFullYear() === hoje.getFullYear()

    const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    return mesmoDia ? `Hoje, ${hora}` : data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}
