import type { Formatos, PontoHistorico, PostInstagram, TipoPost } from "./tipos"

/**
 * As contas que transformam "o que a API devolveu" em "o que a marca lê".
 *
 * Puro de propósito — sem rede, sem banco — para a mesma régua valer na
 * coleta da Meta e na consulta pública, e para dar para conferir o cálculo
 * olhando só este arquivo.
 */

/** Quantas publicações recentes entram nas médias. 12 ≈ um mês de quem posta 3x/semana. */
const JANELA_MEDIAS = 12
const DESTAQUES = 6

const ehNumero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)
const media = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length
const arred = (v: number, casas = 2) => Math.round(v * 10 ** casas) / 10 ** casas

export type Calculo<P extends PostInstagram = PostInstagram> = {
    media_curtidas: number | null
    media_comentarios: number | null
    media_visualizacoes: number | null
    media_alcance: number | null
    media_salvamentos: number | null
    media_compartilhamentos: number | null
    media_tempo_reels_s: number | null
    taxa_engajamento: number | null
    taxa_engajamento_alcance: number | null
    posts_por_semana: number | null
    publicacoes_analisadas: number
    formatos: Formatos | null
    /** Os de melhor resultado, ainda com a URL de origem da imagem. */
    destaques: P[]
}

export function calcularMetricas<P extends PostInstagram>(seguidores: number, posts: P[], agora = new Date()): Calculo<P> {
    const ordenados = [...posts].sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""))
    const recentes = ordenados.slice(0, JANELA_MEDIAS)

    // Quem esconde as curtidas não manda like_count. Esses posts saem da média
    // de curtidas em vez de entrar como zero — zero puxaria a taxa para baixo
    // e diria à marca que ninguém curte o conteúdo.
    const curtidas = recentes.map((p) => p.curtidas).filter(ehNumero)
    const comentarios = recentes.map((p) => p.comentarios).filter(ehNumero)
    const media_curtidas = curtidas.length ? arred(media(curtidas)) : null
    const media_comentarios = comentarios.length ? arred(media(comentarios)) : null

    // Sem curtidas não há taxa: só comentários daria um número verdadeiro na
    // conta e falso na leitura.
    const taxa_engajamento =
        media_curtidas !== null && seguidores > 0
            ? arred(((media_curtidas + (media_comentarios ?? 0)) / seguidores) * 100)
            : null

    const reels = ordenados.filter((p) => p.tipo === "reel" && ehNumero(p.visualizacoes)).slice(0, JANELA_MEDIAS)
    const media_visualizacoes = reels.length ? Math.round(media(reels.map((p) => p.visualizacoes as number))) : null

    // Insights por publicação: só existem para quem conectou a conta, e vêm
    // vazios em post antigo (anterior à conta virar profissional). Média só
    // sobre quem tem o número, pelo mesmo motivo das curtidas.
    const mediaDe = (campo: "alcance" | "salvamentos" | "compartilhamentos") => {
        const xs = recentes.map((p) => p[campo]).filter(ehNumero)
        return xs.length ? Math.round(media(xs)) : null
    }
    const tempos = ordenados.filter((p) => p.tipo === "reel" && ehNumero(p.tempo_medio_s)).slice(0, JANELA_MEDIAS)

    // Engajamento sobre alcance: dos que viram, quantos interagiram. Só entra
    // post que tem os dois números, senão a razão mistura posts diferentes.
    const comAlcance = recentes.filter((p) => ehNumero(p.alcance) && (p.alcance as number) > 0)
    const interacoesDe = (p: PostInstagram) =>
        ehNumero(p.interacoes) ? p.interacoes : (p.curtidas ?? 0) + (p.comentarios ?? 0) + (p.salvamentos ?? 0) + (p.compartilhamentos ?? 0)
    const taxa_engajamento_alcance = comAlcance.length
        ? arred((comAlcance.reduce((s, p) => s + interacoesDe(p), 0) / comAlcance.reduce((s, p) => s + (p.alcance as number), 0)) * 100)
        : null

    return {
        media_curtidas,
        media_comentarios,
        media_visualizacoes,
        media_alcance: mediaDe("alcance"),
        media_salvamentos: mediaDe("salvamentos"),
        media_compartilhamentos: mediaDe("compartilhamentos"),
        media_tempo_reels_s: tempos.length ? arred(media(tempos.map((p) => p.tempo_medio_s as number)), 1) : null,
        taxa_engajamento,
        taxa_engajamento_alcance,
        posts_por_semana: frequencia(ordenados, agora),
        publicacoes_analisadas: recentes.length,
        formatos: formatos(ordenados),
        destaques: [...ordenados]
            .sort((a, b) => pontuacao(b) - pontuacao(a))
            .slice(0, DESTAQUES),
    }
}

function pontuacao(p: PostInstagram) {
    // Com insights, o critério é o mais completo: todas as interações (inclui
    // salvar e compartilhar, que pesam mais para marca que a curtida).
    if (ehNumero(p.interacoes) && p.interacoes > 0) return p.interacoes
    const interacoes = (p.curtidas ?? 0) + (p.comentarios ?? 0)
    // Reel com curtidas ocultas ainda tem visualização; um décimo dela é uma
    // ordem de grandeza razoável para não sumir do ranking.
    return interacoes > 0 ? interacoes : (p.visualizacoes ?? 0) / 10
}

/**
 * Publicações por semana nos últimos 30 dias.
 *
 * Se tudo o que veio da API cabe em menos de 30 dias (perfil que posta
 * muito), contar "quantos nos últimos 30" subestimaria: a janela é a que as
 * publicações cobrem de fato.
 */
function frequencia(ordenados: PostInstagram[], agora: Date): number | null {
    const datas = ordenados.map((p) => (p.data ? Date.parse(p.data) : NaN)).filter((t) => !Number.isNaN(t))
    if (datas.length === 0) return null

    const trintaDias = 30 * 86_400_000
    const corte = agora.getTime() - trintaDias
    const maisAntiga = Math.min(...datas)

    if (maisAntiga <= corte) {
        const noMes = datas.filter((t) => t >= corte).length
        return arred((noMes / 30) * 7, 1)
    }

    const vao = (agora.getTime() - maisAntiga) / 86_400_000
    if (vao < 1) return null
    return arred((datas.length / vao) * 7, 1)
}

function formatos(posts: PostInstagram[]): Formatos | null {
    if (posts.length === 0) return null
    const contagem: Record<TipoPost, number> = { reel: 0, carrossel: 0, foto: 0, video: 0 }
    for (const p of posts) contagem[p.tipo] += 1
    return Object.fromEntries(
        Object.entries(contagem).map(([tipo, n]) => [tipo, Math.round((n / posts.length) * 100)]),
    ) as Formatos
}

/** A data no fuso de quem usa o produto: a coleta das 23h é "hoje", não "amanhã". */
export function diaLocal(iso: string | Date): string {
    const d = typeof iso === "string" ? new Date(iso) : iso
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d)
}

/** Uma coleta por dia (a última), em ordem cronológica, no máximo `dias` pontos. */
export function historicoDiario(
    coletas: { coletado_em: string; seguidores: number | null }[],
    dias = 30,
): PontoHistorico[] {
    const porDia = new Map<string, { t: number; seguidores: number }>()
    for (const c of coletas) {
        if (!ehNumero(c.seguidores)) continue
        const t = Date.parse(c.coletado_em)
        if (Number.isNaN(t)) continue
        const dia = diaLocal(c.coletado_em)
        const atual = porDia.get(dia)
        if (!atual || t > atual.t) porDia.set(dia, { t, seguidores: c.seguidores })
    }
    return [...porDia.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-dias)
        .map(([data, v]) => ({ data, seguidores: v.seguidores }))
}

/**
 * Variação de seguidores em relação a ~30 dias atrás.
 *
 * Com menos de uma semana de histórico o número é ruído (dois dias de
 * diferença viram "+0,4%" que alguém lê como tendência), então fica nulo.
 */
export function crescimento(historico: PontoHistorico[], atual: number, agora = new Date()): number | null {
    if (historico.length === 0 || atual <= 0) return null
    const alvo = agora.getTime() - 30 * 86_400_000
    const umaSemana = agora.getTime() - 7 * 86_400_000

    const candidatos = historico
        .map((p) => ({ ...p, t: Date.parse(`${p.data}T12:00:00-03:00`) }))
        .filter((p) => p.t <= umaSemana && p.seguidores > 0)
    if (candidatos.length === 0) return null

    const base = candidatos.reduce((melhor, p) => (Math.abs(p.t - alvo) < Math.abs(melhor.t - alvo) ? p : melhor))
    return arred(((atual - base.seguidores) / base.seguidores) * 100, 1)
}
