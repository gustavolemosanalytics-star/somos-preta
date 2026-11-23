/**
 * Formato das métricas do Instagram — o contrato entre a coleta (servidor), a
 * vitrine pública, a área do criador e o painel interno.
 *
 * TODA métrica aqui vem da própria conta da criadora, depois que ELA fez
 * login com o Instagram e autorizou a Somos Preta (Instagram API with Unified
 * Login). Não existe mais consulta por @ de terceiros: além de ser contra as
 * regras da Meta, só o login dá acesso a alcance, visualizações e audiência.
 *
 * Vive separado de `lib/instagram/graph.ts` porque aquele arquivo só roda no
 * servidor e estes tipos são importados por componentes de cliente.
 */

/** Hoje só existe uma origem: a conta conectada pela própria criadora. */
export type FonteInstagram = "instagram"

/** O resultado da última tentativa de coleta. */
export type StatusInstagram =
    | "ok"
    /** A criadora revogou o acesso ou o token deixou de valer: precisa reconectar. */
    | "token"
    /** O app não tem a permissão pedida (configuração ou Análise do App pendente). */
    | "permissao"
    | "limite"
    | "indisponivel"
    | "nao_configurado"
    /** Login feito, mas a conta da Meta não tinha conta profissional do Instagram. */
    | "sem_conta"

export type TipoPost = "reel" | "video" | "carrossel" | "foto"

export type PostInstagram = {
    id: string
    tipo: TipoPost
    link: string | null
    /** Cópia no nosso storage quando é destaque; senão, nulo. */
    imagem: string | null
    curtidas: number | null
    comentarios: number | null
    /** Visualizações (insight `views`). */
    visualizacoes: number | null
    /** Contas únicas alcançadas (insight `reach`). */
    alcance: number | null
    salvamentos: number | null
    compartilhamentos: number | null
    interacoes: number | null
    /** Reels: tempo médio assistido, em segundos. */
    tempo_medio_s: number | null
    /** ISO 8601. */
    data: string | null
    legenda: string | null
}

export type StoryInstagram = {
    id: string
    data: string | null
    alcance: number | null
    visualizacoes: number | null
    respostas: number | null
    compartilhamentos: number | null
    interacoes: number | null
}

/** Percentual (0–100) de cada formato entre as publicações analisadas. */
export type Formatos = Record<TipoPost, number>

export type PontoHistorico = { data: string; seguidores: number }
export type PontoAlcance = { data: string; alcance: number }

/** Uma fatia de uma distribuição da audiência, já em percentual. */
export type Fatia = { rotulo: string; pct: number }

export type Audiencia = {
    /** Mulheres, homens, não informado. */
    genero: Fatia[]
    /** Faixas etárias na ordem natural (13-17, 18-24...). */
    idade: Fatia[]
    /** As cidades com mais seguidores, maior primeiro. */
    cidades: Fatia[]
    paises: Fatia[]
}

/** Totais da conta nos últimos 30 dias (insights da conta). */
export type Insights30d = {
    alcance: number | null
    visualizacoes: number | null
    contas_engajadas: number | null
    interacoes: number | null
    curtidas: number | null
    comentarios: number | null
    compartilhamentos: number | null
    salvamentos: number | null
    respostas: number | null
    cliques_links: number | null
    novos_seguidores: number | null
    deixaram_de_seguir: number | null
    /** % do alcance que veio de quem ainda não segue a conta. */
    alcance_nao_seguidores_pct: number | null
}

export type MetricasInstagram = {
    fonte: FonteInstagram
    username: string
    ig_user_id: string | null
    nome: string | null
    biografia: string | null
    foto_url: string | null
    seguidores: number
    seguindo: number | null
    publicacoes: number | null

    // ---- médias por publicação (últimas analisadas) ----
    media_curtidas: number | null
    media_comentarios: number | null
    /** Média de visualizações dos Reels. */
    media_visualizacoes: number | null
    media_alcance: number | null
    media_salvamentos: number | null
    media_compartilhamentos: number | null
    /** Tempo médio assistido dos Reels, em segundos. */
    media_tempo_reels_s: number | null
    /** (curtidas + comentários) médios ÷ seguidores × 100 — a régua do mercado. */
    taxa_engajamento: number | null
    /** interações ÷ alcance × 100 — quanto quem viu, interagiu. */
    taxa_engajamento_alcance: number | null
    posts_por_semana: number | null
    publicacoes_analisadas: number
    formatos: Formatos | null

    // ---- conta ----
    insights_30d: Insights30d | null
    /** Alcance diário dos últimos 30 dias. */
    alcance_diario: PontoAlcance[]
    /** Quem segue a conta. */
    audiencia: Audiencia | null
    /** Quem interagiu no período (pode diferir de quem segue). */
    audiencia_engajada: Audiencia | null
    stories: StoryInstagram[]

    destaques: PostInstagram[]
    /** Um ponto por dia, do mais antigo para o mais novo. */
    historico: PontoHistorico[]
    /** Variação de seguidores em ~30 dias, em %. Nulo sem histórico suficiente. */
    crescimento_30d: number | null
    /** Quando os números acima foram coletados. */
    atualizado_em: string
    /** Resultado da ÚLTIMA tentativa — pode ser erro com dados antigos guardados. */
    status: StatusInstagram
    ultima_tentativa: string
}

/** Uma linha de somos_preta_instagram_coletas, como as telas leem. */
export type ColetaInstagram = {
    id: string
    influencer_id: string
    kit_id: string | null
    username: string
    fonte: string
    seguidores: number | null
    seguindo: number | null
    publicacoes: number | null
    media_curtidas: number | null
    media_comentarios: number | null
    media_visualizacoes: number | null
    taxa_engajamento: number | null
    posts_por_semana: number | null
    publicacoes_analisadas: number
    alcance_30d: number | null
    visualizacoes_30d: number | null
    contas_engajadas_30d: number | null
    interacoes_30d: number | null
    formatos: Formatos | null
    posts: PostInstagram[] | null
    insights: Insights30d | null
    audiencia: Audiencia | null
    stories: StoryInstagram[] | null
    coletado_em: string
}

/** O que a criadora e a equipe veem da conexão — nunca o token. */
export type ConexaoInstagram = {
    ig_user_id: string
    username: string | null
    status: "ativa" | "revogada" | "erro"
    conectado_em: string
    ultima_coleta_em: string | null
    ultimo_erro: string | null
}

/** O que a tela diz para cada status — uma fonte só para criador e equipe. */
export const MENSAGEM_DO_STATUS: Record<Exclude<StatusInstagram, "ok">, string> = {
    token: "O acesso ao seu Instagram foi revogado ou expirou. Conecte de novo para voltar a atualizar.",
    permissao: "A Somos Preta ainda não tem a permissão da Meta para ler esses dados. A equipe já foi avisada.",
    limite: "Muitas consultas ao mesmo tempo. Tente de novo em alguns minutos.",
    indisponivel: "O Instagram não respondeu agora. Tente de novo mais tarde.",
    nao_configurado: "A conexão com o Instagram ainda está sendo ativada pela Somos Preta.",
    sem_conta:
        "Não encontramos uma conta profissional do Instagram nesse login. A conta precisa ser Comercial ou de Criador de conteúdo.",
}

/** O que a tela diz quando o login volta da Meta (?instagram=...). */
export const MENSAGEM_DO_RETORNO: Record<string, { ok: boolean; texto: string }> = {
    conectado: { ok: true, texto: "Instagram conectado. Seus números já estão no seu Mídia Kit." },
    conectado_sem_coleta: { ok: true, texto: "Instagram conectado. Os números chegam em alguns minutos." },
    cancelado: { ok: false, texto: "Você cancelou o login. Nada foi conectado." },
    sem_conta: { ok: false, texto: MENSAGEM_DO_STATUS.sem_conta },
    ja_conectada: { ok: false, texto: "Essa conta do Instagram já está conectada a outro perfil na Somos Preta." },
    expirado: { ok: false, texto: "O login demorou demais e expirou. Tente de novo." },
    erro: { ok: false, texto: "Não deu para concluir a conexão agora. Tente de novo." },
    nao_configurado: { ok: false, texto: MENSAGEM_DO_STATUS.nao_configurado },
}

/** "128,4 mil", "1,2 mi" — do jeito que se fala no Brasil. */
export function numeroCompacto(valor: number | null | undefined): string {
    if (typeof valor !== "number" || !Number.isFinite(valor)) return "—"
    if (Math.abs(valor) < 1000) return Math.round(valor).toLocaleString("pt-BR")
    return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(valor)
}

export function percentual(valor: number | null | undefined, casas = 1): string {
    if (typeof valor !== "number" || !Number.isFinite(valor)) return "—"
    return `${valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`
}

/** "38s", "1min 12s". */
export function duracao(segundos: number | null | undefined): string {
    if (typeof segundos !== "number" || !Number.isFinite(segundos)) return "—"
    const s = Math.round(segundos)
    if (s < 60) return `${s}s`
    return `${Math.floor(s / 60)}min ${s % 60}s`
}

/** Lê o jsonb `metricas_instagram` com o mínimo de desconfiança. */
export function lerMetricas(valor: unknown): MetricasInstagram | null {
    if (!valor || typeof valor !== "object") return null
    const m = valor as Partial<MetricasInstagram>
    if (typeof m.username !== "string" || typeof m.seguidores !== "number") return null
    return {
        ...(m as MetricasInstagram),
        destaques: Array.isArray(m.destaques) ? m.destaques : [],
        historico: Array.isArray(m.historico) ? m.historico : [],
        alcance_diario: Array.isArray(m.alcance_diario) ? m.alcance_diario : [],
        stories: Array.isArray(m.stories) ? m.stories : [],
        insights_30d: m.insights_30d ?? null,
        audiencia: m.audiencia ?? null,
        audiencia_engajada: m.audiencia_engajada ?? null,
    }
}
