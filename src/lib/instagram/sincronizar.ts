import { createAdminClient } from "@/lib/supabase/server"
import { slugify } from "@/lib/slug"

import { calcularMetricas, crescimento, diaLocal, historicoDiario } from "./calculo"
import { decifrar } from "./cofre"
import { coletarConta, type PostColetado } from "./graph"
import {
    MENSAGEM_DO_STATUS, lerMetricas,
    type Audiencia, type MetricasInstagram, type PostInstagram, type StatusInstagram,
} from "./tipos"

/**
 * A coleta de ponta a ponta — só servidor, sempre com service_role.
 *
 * Um caminho só para os três gatilhos (a criadora acabou de conectar ou
 * apertou "Atualizar", a equipe apertou "Atualizar" no painel, a rotina
 * diária), para que os três gravem a mesma coisa nos mesmos lugares:
 *
 *   1. somos_preta_instagram_coletas   uma linha nova (histórico)
 *   2. somos_preta_influencers         seguidores, engajamento, médias,
 *                                      audiência — o que o painel lista
 *   3. somos_preta_midia_kits          metricas_instagram (o que a vitrine
 *                                      desenha) e redes.instagram
 *
 * Toda coleta parte de uma CONEXÃO: a criadora fez login e autorizou. Sem
 * conexão, não há coleta.
 *
 * IMAGENS: as URLs que a Meta devolve são assinadas e vencem em dias. A foto
 * de perfil e as capas dos destaques são copiadas para o bucket `midia-kit`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/** A criadora pode apertar "Atualizar" à vontade; a Meta só é consultada a cada 10 min. */
const INTERVALO_MINIMO_MS = 10 * 60 * 1000
const BUCKET = "midia-kit"
const MIME_ACEITO: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
}
/** Só baixamos de CDN da própria Meta: a URL vem de resposta de API, mas não custa conferir. */
const HOST_DE_IMAGEM = /(^|\.)(cdninstagram\.com|fbcdn\.net)$/i

export type ResultadoSincronizacao =
    | {
          ok: true
          metricas: MetricasInstagram
          redes: Record<string, unknown> | null
          /** Campos do kit que estavam vazios e vieram do Instagram. */
          preenchido: { avatar_url?: string; bio?: string }
          doCache: boolean
      }
    | {
          ok: false
          status: Exclude<StatusInstagram, "ok">
          mensagem: string
          metricas: MetricasInstagram | null
      }

// ---------------------------------------------------------------------------
// kit
// ---------------------------------------------------------------------------

/**
 * O kit da criadora, criado se ainda não existir. Quem acabou de criar a conta
 * e foi direto conectar o Instagram ainda não abriu o editor, que é onde o kit
 * costumava nascer. Mesmas regras de lá: nasce rascunho, slug pelo nome.
 */
export async function garantirKit(profileId: string): Promise<{ id: string; influencer_id: string | null } | null> {
    const admin = createAdminClient()
    const buscar = () =>
        admin.from("somos_preta_midia_kits").select("id, influencer_id").eq("cadastrado_por", profileId).maybeSingle()

    const { data: existente } = await buscar()
    if (existente) return existente

    const { data: perfil } = await admin.from("somos_preta_profiles").select("nome").eq("id", profileId).maybeSingle()
    const nome = perfil?.nome || "Criador"
    const base = slugify(nome)
    for (let tentativa = 1; tentativa <= 20; tentativa++) {
        const slug = tentativa === 1 ? base : `${base}-${tentativa}`
        const { error } = await admin
            .from("somos_preta_midia_kits")
            .insert({ cadastrado_por: profileId, nome, slug, publicado: false, tema: "terracota" })
        if (!error) break
        if (error.code !== "23505") return null
    }
    const { data: criado } = await buscar()
    return criado ?? null
}

// ---------------------------------------------------------------------------
// imagens
// ---------------------------------------------------------------------------

async function copiarImagem(admin: any, origem: string | null, caminhoSemExtensao: string): Promise<string | null> {
    if (!origem) return null
    try {
        const url = new URL(origem)
        if (url.protocol !== "https:" || !HOST_DE_IMAGEM.test(url.hostname)) return null

        const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) })
        if (!res.ok) return null
        const tipo = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase()
        const extensao = MIME_ACEITO[tipo]
        if (!extensao) return null

        const bytes = await res.arrayBuffer()
        if (bytes.byteLength === 0 || bytes.byteLength > 8 * 1024 * 1024) return null

        const caminho = `${caminhoSemExtensao}.${extensao}`
        const { error } = await admin.storage
            .from(BUCKET)
            .upload(caminho, bytes, { contentType: tipo, upsert: true, cacheControl: "86400" })
        if (error) {
            console.warn("[instagram] não consegui guardar imagem:", error.message)
            return null
        }
        const { data } = admin.storage.from(BUCKET).getPublicUrl(caminho)
        // Mesmo caminho a cada coleta (upsert): sem o carimbo, a CDN do
        // Supabase continuaria servindo a capa antiga por um dia.
        return `${data.publicUrl}?v=${Date.now().toString(36)}`
    } catch {
        return null
    }
}

/** Apaga da pasta o que não é mais destaque (ou tudo, se `manter` vier vazio). */
async function limparPasta(admin: any, pasta: string, manter: Set<string>) {
    try {
        const { data } = await admin.storage.from(BUCKET).list(pasta, { limit: 200 })
        const sobras = ((data ?? []) as { name: string }[])
            .map((f) => f.name)
            .filter((nome) => !manter.has(nome.replace(/\.[a-z0-9]+$/i, "")))
            .map((nome) => `${pasta}/${nome}`)
        if (sobras.length) await admin.storage.from(BUCKET).remove(sobras)
    } catch {
        // Melhor esforço: lixo no bucket não justifica falhar a coleta.
    }
}

const pastaDe = (conexao: { influencer_id: string | null; ig_user_id: string }) =>
    `ig/${conexao.influencer_id ?? conexao.ig_user_id}`

/** O formato que a lista do painel já lia em `audience_data`. */
function audienceData(a: Audiencia | null) {
    if (!a) return null
    return {
        ageRanges: Object.fromEntries(a.idade.map((f) => [f.rotulo, f.pct])),
        genderSplit: Object.fromEntries(a.genero.map((f) => [f.rotulo, f.pct])),
        topCities: a.cidades.map((f) => f.rotulo),
        // Campo novo, com os percentuais e a origem.
        fonte: "instagram",
        cidades: a.cidades,
        paises: a.paises,
    }
}

// ---------------------------------------------------------------------------
// coleta
// ---------------------------------------------------------------------------

type LinhaConexao = {
    id: string
    profile_id: string
    kit_id: string | null
    influencer_id: string | null
    ig_user_id: string
    username: string | null
    token_cifrado: string
    status: string
    ultima_coleta_em: string | null
}

export async function sincronizarConexao(opcoes: {
    profileId: string
    /** Ignora o intervalo mínimo (equipe, rotina, logo após conectar). */
    forcar?: boolean
    /** Preenche foto e bio do kit quando estiverem vazias (primeira conexão). */
    preencherKit?: boolean
}): Promise<ResultadoSincronizacao> {
    const admin = createAdminClient()
    const agora = new Date()
    const agoraIso = agora.toISOString()

    const { data: conexao } = (await admin
        .from("somos_preta_instagram_conexoes")
        .select("id, profile_id, kit_id, influencer_id, ig_user_id, username, token_cifrado, status, ultima_coleta_em")
        .eq("profile_id", opcoes.profileId)
        .maybeSingle()) as { data: LinhaConexao | null }

    if (!conexao) {
        return { ok: false, status: "token", mensagem: "Conecte seu Instagram para trazer seus números.", metricas: null }
    }

    // O kit pode ter sido criado depois da conexão (ou o vínculo se perdido).
    let kitId = conexao.kit_id
    let influencerId = conexao.influencer_id
    if (!kitId) {
        const kit = await garantirKit(conexao.profile_id)
        kitId = kit?.id ?? null
        influencerId = influencerId ?? kit?.influencer_id ?? null
    }
    const { data: kit } = kitId
        ? await admin.from("somos_preta_midia_kits").select("id, influencer_id, redes, metricas_instagram, avatar_url, bio").eq("id", kitId).maybeSingle()
        : { data: null as any }
    influencerId = influencerId ?? kit?.influencer_id ?? null

    const anterior = lerMetricas(kit?.metricas_instagram)

    // ---------- intervalo mínimo ----------
    if (
        !opcoes.forcar &&
        anterior?.status === "ok" &&
        conexao.ultima_coleta_em &&
        agora.getTime() - Date.parse(conexao.ultima_coleta_em) < INTERVALO_MINIMO_MS
    ) {
        return { ok: true, metricas: anterior, redes: kit?.redes ?? null, preenchido: {}, doCache: true }
    }

    // ---------- consulta ----------
    let token: string
    try {
        token = decifrar(conexao.token_cifrado)
    } catch (erro) {
        console.error("[instagram] não consegui abrir o token (INSTAGRAM_TOKEN_SECRET mudou?):", erro)
        await admin.from("somos_preta_instagram_conexoes").update({ status: "erro", ultimo_erro: "token ilegível" }).eq("id", conexao.id)
        return { ok: false, status: "token", mensagem: MENSAGEM_DO_STATUS.token, metricas: anterior }
    }

    const coleta = await coletarConta(conexao.ig_user_id, token)

    if (!coleta.ok) {
        const metricas = anterior ? { ...anterior, status: coleta.status, ultima_tentativa: agoraIso } : null
        await Promise.all([
            admin
                .from("somos_preta_instagram_conexoes")
                .update({
                    status: coleta.status === "token" ? "revogada" : "erro",
                    ultimo_erro: coleta.detalhe ?? coleta.status,
                    updated_at: agoraIso,
                })
                .eq("id", conexao.id),
            kit ? admin.from("somos_preta_midia_kits").update({ metricas_instagram: metricas }).eq("id", kit.id) : null,
            influencerId
                ? admin.from("somos_preta_influencers").update({ instagram_status: coleta.status, instagram_sincronizado_em: agoraIso }).eq("id", influencerId)
                : null,
        ])
        return { ok: false, status: coleta.status, mensagem: MENSAGEM_DO_STATUS[coleta.status], metricas }
    }

    // ---------- contas e imagens ----------
    const conta = coleta.conta
    const calculo = calcularMetricas(conta.seguidores, conta.posts, agora)
    const pasta = pastaDe({ influencer_id: influencerId, ig_user_id: conta.ig_user_id })
    const nomeDoArquivo = (id: string) => id.replace(/[^\w-]/g, "")

    const [foto_url, ...imagens] = await Promise.all([
        copiarImagem(admin, conta.foto_origem, `${pasta}/perfil`),
        ...calculo.destaques.map((p) => copiarImagem(admin, p.imagem_origem, `${pasta}/${nomeDoArquivo(p.id)}`)),
    ])

    const semOrigem = (p: PostColetado): PostInstagram => {
        const copia: PostInstagram & { imagem_origem?: string | null } = { ...p }
        delete copia.imagem_origem
        return copia
    }
    const destaques: PostInstagram[] = calculo.destaques.map((p, i) => ({ ...semOrigem(p), imagem: imagens[i] ?? null }))

    await limparPasta(
        admin,
        pasta,
        new Set(["perfil", ...calculo.destaques.filter((_, i) => imagens[i]).map((p) => nomeDoArquivo(p.id))]),
    )

    // ---------- histórico ----------
    let historico = [{ data: diaLocal(agora), seguidores: conta.seguidores }]
    if (influencerId) {
        const { error: erroColeta } = await admin.from("somos_preta_instagram_coletas").insert({
            influencer_id: influencerId,
            kit_id: kit?.id ?? null,
            username: conta.username,
            ig_user_id: conta.ig_user_id,
            fonte: "instagram",
            seguidores: conta.seguidores,
            seguindo: conta.seguindo,
            publicacoes: conta.publicacoes,
            media_curtidas: calculo.media_curtidas,
            media_comentarios: calculo.media_comentarios,
            media_visualizacoes: calculo.media_visualizacoes,
            taxa_engajamento: calculo.taxa_engajamento,
            posts_por_semana: calculo.posts_por_semana,
            publicacoes_analisadas: calculo.publicacoes_analisadas,
            alcance_30d: conta.insights?.alcance ?? null,
            visualizacoes_30d: conta.insights?.visualizacoes ?? null,
            contas_engajadas_30d: conta.insights?.contas_engajadas ?? null,
            interacoes_30d: conta.insights?.interacoes ?? null,
            formatos: calculo.formatos,
            insights: conta.insights,
            audiencia: conta.audiencia,
            stories: conta.stories,
            // A URL de origem vence; guardar seria guardar link quebrado.
            posts: conta.posts.map((p) => {
                const destaque = destaques.find((d) => d.id === p.id)
                return { ...semOrigem(p), imagem: destaque?.imagem ?? null }
            }),
            coletado_em: agoraIso,
        })
        if (erroColeta) console.error("[instagram] não consegui gravar a coleta (migrations 0024/0025 aplicadas?):", erroColeta.message)

        const desde = new Date(agora.getTime() - 120 * 86_400_000).toISOString()
        const { data: linhas } = await admin
            .from("somos_preta_instagram_coletas")
            .select("coletado_em, seguidores, username")
            .eq("influencer_id", influencerId)
            .gte("coletado_em", desde)
            .order("coletado_em", { ascending: true })

        // Trocar de conta começa um histórico novo: a curva de outra conta não
        // é crescimento desta.
        const daMesmaConta = ((linhas ?? []) as { coletado_em: string; seguidores: number | null; username: string }[])
            .filter((l) => l.username === conta.username)
        if (daMesmaConta.length) historico = historicoDiario(daMesmaConta, 30)
    }

    const metricas: MetricasInstagram = {
        fonte: "instagram",
        username: conta.username,
        ig_user_id: conta.ig_user_id,
        nome: conta.nome,
        biografia: conta.biografia,
        foto_url: foto_url ?? anterior?.foto_url ?? null,
        seguidores: conta.seguidores,
        seguindo: conta.seguindo,
        publicacoes: conta.publicacoes,
        media_curtidas: calculo.media_curtidas,
        media_comentarios: calculo.media_comentarios,
        media_visualizacoes: calculo.media_visualizacoes,
        media_alcance: calculo.media_alcance,
        media_salvamentos: calculo.media_salvamentos,
        media_compartilhamentos: calculo.media_compartilhamentos,
        media_tempo_reels_s: calculo.media_tempo_reels_s,
        taxa_engajamento: calculo.taxa_engajamento,
        taxa_engajamento_alcance: calculo.taxa_engajamento_alcance,
        posts_por_semana: calculo.posts_por_semana,
        publicacoes_analisadas: calculo.publicacoes_analisadas,
        formatos: calculo.formatos,
        insights_30d: conta.insights,
        alcance_diario: conta.alcance_diario,
        audiencia: conta.audiencia,
        audiencia_engajada: conta.audiencia_engajada,
        stories: conta.stories,
        destaques,
        historico,
        crescimento_30d: crescimento(historico, conta.seguidores, agora),
        atualizado_em: agoraIso,
        status: "ok",
        ultima_tentativa: agoraIso,
    }

    // ---------- base de criadores ----------
    if (influencerId) {
        const { data: inf } = await admin
            .from("somos_preta_influencers")
            .select("engagement, growth_rate")
            .eq("id", influencerId)
            .maybeSingle()
        const { error } = await admin
            .from("somos_preta_influencers")
            .update({
                username: conta.username,
                instagram: conta.username,
                followers: conta.seguidores,
                engagement: metricas.taxa_engajamento ?? inf?.engagement ?? 0,
                avg_likes: metricas.media_curtidas !== null ? Math.round(metricas.media_curtidas) : 0,
                avg_comments: metricas.media_comentarios !== null ? Math.round(metricas.media_comentarios) : 0,
                avg_shares: metricas.media_compartilhamentos ?? 0,
                views_medias: metricas.media_visualizacoes ?? 0,
                growth_rate: metricas.crescimento_30d ?? inf?.growth_rate ?? 0,
                ...(conta.audiencia ? { audience_data: audienceData(conta.audiencia) } : {}),
                instagram_fonte: "instagram",
                instagram_status: "ok",
                instagram_sincronizado_em: agoraIso,
            })
            .eq("id", influencerId)
        if (error) console.error("[instagram] não consegui atualizar o criador:", error.message)
    }

    // ---------- kit ----------
    let redes: Record<string, unknown> | null = kit?.redes ?? null
    const preenchido: { avatar_url?: string; bio?: string } = {}
    if (kit) {
        const atuais = (kit.redes && typeof kit.redes === "object" ? kit.redes : {}) as Record<string, any>
        redes = {
            ...atuais,
            instagram: {
                ...(atuais.instagram ?? {}),
                handle: conta.username,
                followers: conta.seguidores,
                engagement_rate: metricas.taxa_engajamento,
                verificado: true,
            },
        }
        const patch: Record<string, unknown> = { metricas_instagram: metricas, redes }
        if (opcoes.preencherKit) {
            if (!kit.avatar_url && metricas.foto_url) preenchido.avatar_url = patch.avatar_url = metricas.foto_url
            if (!kit.bio?.trim() && conta.biografia?.trim()) preenchido.bio = patch.bio = conta.biografia.trim().slice(0, 280)
        }
        const { error } = await admin.from("somos_preta_midia_kits").update(patch).eq("id", kit.id)
        if (error) {
            console.error("[instagram] não consegui gravar no kit (migration 0024 aplicada?):", error.message)
            return { ok: false, status: "indisponivel", mensagem: MENSAGEM_DO_STATUS.indisponivel, metricas: anterior }
        }
    }

    await admin
        .from("somos_preta_instagram_conexoes")
        .update({
            username: conta.username,
            kit_id: kit?.id ?? kitId,
            influencer_id: influencerId,
            status: "ativa",
            ultimo_erro: null,
            ultima_coleta_em: agoraIso,
            updated_at: agoraIso,
        })
        .eq("id", conexao.id)

    return { ok: true, metricas, redes, preenchido, doCache: false }
}

// ---------------------------------------------------------------------------
// desconectar e apagar
// ---------------------------------------------------------------------------

/**
 * Desconecta e APAGA o que veio da Meta: token, histórico de coletas, o
 * retrato do kit, as imagens copiadas e os números da ficha. É a mesma rotina
 * do botão "Desconectar" e do pedido de exclusão de dados vindo da Meta — os
 * termos da plataforma pedem as duas coisas.
 */
export async function apagarConexao(filtro: { profileId?: string; metaUserId?: string; igUserId?: string }) {
    const admin = createAdminClient()
    let consulta = admin.from("somos_preta_instagram_conexoes").select("id, profile_id, kit_id, influencer_id, ig_user_id")
    if (filtro.profileId) consulta = consulta.eq("profile_id", filtro.profileId)
    else if (filtro.metaUserId) consulta = consulta.eq("meta_user_id", filtro.metaUserId)
    else if (filtro.igUserId) consulta = consulta.eq("ig_user_id", filtro.igUserId)
    else return 0

    const { data } = await consulta
    const conexoes = (data ?? []) as { id: string; profile_id: string; kit_id: string | null; influencer_id: string | null; ig_user_id: string }[]

    for (const c of conexoes) {
        const kitId = c.kit_id ?? (await garantirKitSemCriar(admin, c.profile_id))
        if (kitId) {
            const { data: kit } = await admin.from("somos_preta_midia_kits").select("redes").eq("id", kitId).maybeSingle()
            const redes = { ...((kit?.redes ?? {}) as Record<string, unknown>) }
            delete redes.instagram
            await admin.from("somos_preta_midia_kits").update({ metricas_instagram: null, redes }).eq("id", kitId)
        }
        if (c.influencer_id) {
            await admin.from("somos_preta_instagram_coletas").delete().eq("influencer_id", c.influencer_id)
            await admin
                .from("somos_preta_influencers")
                .update({
                    followers: 0, engagement: 0, avg_likes: 0, avg_comments: 0, avg_shares: 0, views_medias: 0,
                    growth_rate: 0, audience_data: null,
                    instagram_fonte: null, instagram_status: "desconectado", instagram_sincronizado_em: null,
                })
                .eq("id", c.influencer_id)
                .eq("instagram_fonte", "instagram")
        }
        await limparPasta(admin, pastaDe(c), new Set())
        await admin.from("somos_preta_instagram_conexoes").delete().eq("id", c.id)
    }
    return conexoes.length
}

async function garantirKitSemCriar(admin: any, profileId: string): Promise<string | null> {
    const { data } = await admin.from("somos_preta_midia_kits").select("id").eq("cadastrado_por", profileId).maybeSingle()
    return data?.id ?? null
}

// ---------------------------------------------------------------------------
// rotina
// ---------------------------------------------------------------------------

/**
 * A rotina diária: atualiza as conexões que estão há mais tempo sem coleta.
 *
 * Para cedo quando o problema é do app (configuração, limite) — insistir só
 * gastaria a cota. Token revogado de UMA criadora não para a fila: é dela.
 */
export async function sincronizarLote(limite = 30) {
    const admin = createAdminClient()
    const corte = new Date(Date.now() - 20 * 3_600_000).toISOString()

    const { data, error } = await admin
        .from("somos_preta_instagram_conexoes")
        .select("profile_id, username")
        .eq("status", "ativa")
        .or(`ultima_coleta_em.is.null,ultima_coleta_em.lt.${corte}`)
        .order("ultima_coleta_em", { ascending: true, nullsFirst: true })
        .limit(limite)

    if (error) return { ok: false as const, erro: error.message, processados: 0, atualizados: 0, falhas: [] as string[], interrompido: null }

    let atualizados = 0
    const falhas: string[] = []
    let interrompido: string | null = null

    for (const c of (data ?? []) as { profile_id: string; username: string | null }[]) {
        const r = await sincronizarConexao({ profileId: c.profile_id, forcar: true })
        if (r.ok) atualizados += 1
        else {
            falhas.push(`@${c.username ?? "?"}: ${r.status}`)
            if (r.status === "limite" || r.status === "nao_configurado" || r.status === "permissao") {
                interrompido = r.status
                break
            }
        }
        // Espaça as contas: a cota é por hora, mas rajada é o que dispara bloqueio.
        await new Promise((ok) => setTimeout(ok, 400))
    }

    return { ok: true as const, processados: atualizados + falhas.length, atualizados, falhas, interrompido }
}
