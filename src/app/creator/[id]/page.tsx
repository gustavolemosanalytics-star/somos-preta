import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ExternalLink, Eye, Pencil, Sparkles } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/supabase/auth"
import { MapaTerritorio } from "@/components/public/mapa-territorio"
import { CopyLinkButton } from "../copy-link-button"
import type { MidiaKit } from "@/lib/db/types"

/**
 * Painel do criador: o estado do Media Kit e os atalhos para editar e
 * compartilhar. Segue a mesma linguagem da landing — manuscrita, traço coral e
 * assinatura de território — para o criador não sentir que trocou de produto ao
 * entrar na conta.
 */

const EIXOS = ["Pessoas", "Território", "Cultura", "Autenticidade", "Movimento"]

export default async function CreatorPainelPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const profile = await getProfile()
    const supabase = await createClient()

    const { data: kit } = await supabase
        .from("somos_preta_midia_kits")
        .select("*")
        .eq("cadastrado_por", id)
        .maybeSingle<MidiaKit>()

    const primeiroNome = (profile?.nome ?? "").split(" ")[0]

    return (
        <div className="mx-auto w-full max-w-[1100px]">
            {/* ---------- abertura ---------- */}
            <header className="relative">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    Área do criador
                </p>

                <h1 className="mt-4 max-w-2xl text-[clamp(1.9rem,3.2vw,2.8rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
                    {primeiroNome ? `Olá, ${primeiroNome}.` : "Olá."}
                    <br />
                    <span className="text-brand-terracota">
                        {kit ? "Seu Media Kit está aqui." : "Vamos montar seu Media Kit?"}
                    </span>
                </h1>

                <p
                    aria-hidden
                    className="pointer-events-none absolute right-0 top-0 hidden max-w-[9ch] -rotate-3 font-manuscrita text-[clamp(1.2rem,1.6vw,1.7rem)] leading-[1.2] text-brand-coral lg:block"
                >
                    Criar também é construir futuro.
                    <span aria-hidden className="mt-2 block h-[2px] w-16 rounded-full bg-brand-coral" />
                </p>
            </header>

            {kit ? <KitExistente kit={kit} idCriador={id} /> : <KitAusente idCriador={id} />}

            {/* ---------- assinatura ---------- */}
            <footer className="mt-14 flex items-center gap-5 border-t border-border pt-8">
                <MapaTerritorio aria-hidden className="h-12 w-auto shrink-0 text-brand-areia" />
                <ul aria-hidden className="flex flex-wrap gap-x-5 gap-y-1.5">
                    {EIXOS.map((e) => (
                        <li
                            key={e}
                            className="text-[10px] font-medium uppercase leading-none tracking-[0.2em] text-muted-foreground"
                        >
                            {e}
                        </li>
                    ))}
                </ul>
            </footer>
        </div>
    )
}

/** Estado inicial: ainda não existe Media Kit. */
function KitAusente({ idCriador }: { idCriador: string }) {
    return (
        <section className="mt-10 grid items-center gap-8 rounded-3xl border border-border bg-card p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)] lg:p-10">
            <div>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-terracota/12 text-brand-terracota">
                    <Sparkles className="h-5 w-5" aria-hidden />
                </span>

                <h2 className="mt-5 text-xl font-bold tracking-tight">
                    Você ainda não tem um Media Kit
                </h2>
                <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                    Monte seu perfil profissional com suas redes, métricas e portfólio, e
                    compartilhe com marcas em um link só.
                </p>

                <Link
                    href={`/creator/${idCriador}/media-kit`}
                    className="group mt-7 inline-flex h-13 items-center gap-3 rounded-full bg-brand-terracota px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-brand-coral"
                >
                    Criar meu Media Kit
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
            </div>

            <div className="relative hidden aspect-[4/5] overflow-hidden rounded-2xl bg-muted lg:block">
                <Image
                    src="/media-kit/perfil.webp"
                    alt="Exemplo de Media Kit da plataforma"
                    fill
                    sizes="(max-width: 1024px) 0px, 26vw"
                    className="object-cover"
                />
            </div>
        </section>
    )
}

/** Media Kit já criado: estado, atalhos e link público. */
function KitExistente({ kit, idCriador }: { kit: MidiaKit; idCriador: string }) {
    const iniciais = kit.nome.slice(0, 2).toUpperCase()

    return (
        <section className="mt-10 overflow-hidden rounded-3xl border border-border bg-card">
            <div className="flex flex-wrap items-start gap-5 p-6 sm:p-8">
                <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
                    {kit.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={kit.avatar_url} alt={kit.nome} className="h-full w-full object-cover" />
                    ) : (
                        <span className="flex h-full w-full items-center justify-center text-xl font-bold text-muted-foreground">
                            {iniciais}
                        </span>
                    )}
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="truncate text-xl font-bold tracking-tight">{kit.nome}</h2>
                        <span
                            className={
                                kit.publicado
                                    ? "rounded-full bg-status-sucesso/12 px-3 py-1 text-[11px] font-medium text-status-sucesso"
                                    : "rounded-full bg-status-neutro/12 px-3 py-1 text-[11px] font-medium text-status-neutro"
                            }
                        >
                            {kit.publicado ? "Publicado" : "Rascunho"}
                        </span>
                    </div>

                    {kit.bio && (
                        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                            {kit.bio}
                        </p>
                    )}

                    {!kit.publicado && (
                        <p className="mt-3 text-[13px] text-muted-foreground">
                            Seu Media Kit ainda está em rascunho — publique para poder
                            compartilhar o link.
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-border bg-muted/30 px-6 py-5 sm:px-8">
                <Link
                    href={`/creator/${idCriador}/media-kit`}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-terracota px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-coral"
                >
                    <Pencil className="h-4 w-4" aria-hidden />
                    Editar Media Kit
                </Link>

                {kit.publicado && (
                    <>
                        <Link
                            href={`/kit/${kit.slug}`}
                            target="_blank"
                            className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-6 text-sm font-semibold transition-colors hover:border-brand-terracota hover:bg-accent"
                        >
                            <Eye className="h-4 w-4" aria-hidden />
                            Ver página pública
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                        <CopyLinkButton path={`/kit/${kit.slug}`} />
                    </>
                )}
            </div>
        </section>
    )
}
