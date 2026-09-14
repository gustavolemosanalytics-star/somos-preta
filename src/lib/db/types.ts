// Tipos das tabelas somos_preta_* (espelham o schema em supabase/migrations/0001_somos_preta_init.sql)

export type Role = "admin" | "gestor" | "analista" | "creator" | "pendente"
export type InfluencerStatus = "ativo" | "inativo" | "negociando" | "bloqueado"
export type CampanhaStatus =
    | "rascunho" | "planejamento" | "em_aprovacao" | "ativa" | "concluida" | "cancelada"

/** Funil de entrega da campanha — ortogonal ao status administrativo. */
export type CampanhaEtapa = "briefing" | "mapeamento" | "aprovacao" | "producao" | "relatorio"

export type ClienteStatus = "prospeccao" | "ativo" | "pausado" | "encerrado"
export type TarefaStatus =
    | "backlog" | "a_fazer" | "em_andamento" | "em_revisao" | "aguardando_terceiro"
    | "aguardando_aprovacao" | "bloqueada" | "concluida" | "cancelada"
export type TarefaPrioridade = "baixa" | "media" | "alta" | "urgente"
export type TarefaEventoTipo =
    | "criacao" | "status" | "prioridade" | "prazo" | "responsavel" | "solicitante"
    | "colaborador_adicionado" | "colaborador_removido" | "conclusao" | "reabertura"
    | "titulo" | "descricao" | "tags" | "campanha" | "arquivamento" | "evidencia_obrigatoria"
export type TarefaComentarioTipo = "comentario" | "duvida" | "bloqueio" | "atualizacao" | "solicitacao_revisao"
export type TarefaAnexoTipo = "imagem" | "pdf_documento" | "video" | "link"
export type NotificacaoTipo = "tarefa_atribuida" | "mencao" | "comentario" | "solicitacao_revisao" | "conclusao"
export type ContratoStatus = "pendente" | "assinado" | "expirado" | "cancelado"
// Etapas do fluxo editorial do blog (ver 0018_blog_editorial.sql). A ordem aqui
// é a do funil: escreve → manda revisar → agenda → publica; despublicado e
// arquivado são as duas saídas de quem já esteve no ar.
export type BlogStatus =
    | "rascunho" | "em_revisao" | "agendado"
    | "publicado" | "despublicado" | "arquivado"

export type Profile = {
    id: string
    nome: string | null
    email: string | null
    avatar_url: string | null
    /** Permissão: quem pode o quê. Não é como a pessoa se apresenta. */
    role: Role
    /** Como a pessoa aparece para o cliente ("Account Manager"). */
    cargo: string | null
    created_at: string
    updated_at: string
}

export type Cliente = {
    id: string
    nome: string
    empresa: string | null
    email: string | null
    telefone: string | null
    logo_url: string | null
    segmento: string | null
    cidade: string | null
    estado: string | null
    site: string | null
    observacoes: string | null
    status: ClienteStatus
    /** Quem atende a conta hoje — diferente de created_by, que não se reatribui. */
    responsavel_id: string | null
    contato_nome: string | null
    contato_cargo: string | null
    contato_avatar_url: string | null
    created_by: string | null
    created_at: string
    updated_at: string
}

export type Influencer = {
    id: string
    nome: string
    email: string | null
    telefone: string | null
    username: string | null
    instagram: string | null
    tiktok: string | null
    youtube: string | null
    twitter: string | null
    avatar_url: string | null
    bio: string | null
    followers: number
    engagement: number
    avg_likes: number
    avg_comments: number
    avg_shares: number
    growth_rate: number
    views_medias: number
    nicho: string[]
    genero: string | null
    estado: string | null
    cidade: string | null
    status: InfluencerStatus
    cache_value: number | null
    audience_data: Record<string, unknown> | null
    portfolio: unknown | null
    tags: string[]
    fonte: "app" | "interna"
    created_at: string
    updated_at: string
}

export type Campanha = {
    id: string
    cliente_id: string | null
    nome: string
    briefing: string | null
    objetivo: string | null
    budget: number
    data_inicio: string | null
    data_fim: string | null
    status: CampanhaStatus
    /** Posição no funil de entrega; o stepper do card desenha isto. */
    etapa: CampanhaEtapa
    responsavel: string | null
    prioridade: TarefaPrioridade
    /** `budget` é o campo legado; os três abaixo são os momentos do valor. */
    orcamento_estimado: number | null
    orcamento_aprovado: number | null
    orcamento_final: number | null
    capa_url: string | null
    tagline: string | null
    /** Quando o status mudou pela última vez — não confundir com updated_at. */
    status_desde: string
    share_token: string
    created_by: string | null
    created_at: string
    updated_at: string
}

export type Tarefa = {
    id: string
    campanha_id: string
    titulo: string
    descricao: string | null
    status: TarefaStatus
    prioridade: TarefaPrioridade
    responsavel: string | null
    solicitante_id: string | null
    influencer_id: string | null
    data_inicio: string | null
    data_entrega: string | null
    horario: string | null
    concluida_em: string | null
    evidencia_obrigatoria: boolean
    tags: string[]
    arquivada: boolean
    area_id: string | null
    /** Altura do bloco na grade do calendário; data_entrega + horario dão a posição. */
    duracao_minutos: number
    ordem: number
    created_by: string | null
    created_at: string
    updated_at: string
}

export type Subtarefa = {
    id: string
    tarefa_id: string
    titulo: string
    concluida: boolean
    responsavel_id: string | null
    prazo: string | null
    status: TarefaStatus
    ordem: number
    created_by: string | null
    created_at: string
    updated_at: string
}

export type TarefaComentario = {
    id: string
    tarefa_id: string
    subtarefa_id: string | null
    autor_id: string | null
    conteudo: string
    tipo: TarefaComentarioTipo
    created_at: string
}

export type TarefaMencao = {
    id: string
    comentario_id: string
    profile_id: string
    created_at: string
}

export type TarefaAnexo = {
    id: string
    tarefa_id: string
    subtarefa_id: string | null
    tipo: TarefaAnexoTipo
    storage_path: string | null
    link_externo: string | null
    nome: string | null
    observacao: string | null
    is_evidencia: boolean
    autor_id: string | null
    created_at: string
}

export type Notificacao = {
    id: string
    destinatario_id: string
    tipo: NotificacaoTipo
    tarefa_id: string | null
    ator_id: string | null
    lida: boolean
    created_at: string
}

export type TarefaColaborador = {
    id: string
    tarefa_id: string
    profile_id: string
    created_at: string
}

export type TarefaEvento = {
    id: string
    tarefa_id: string
    tipo: TarefaEventoTipo
    autor_id: string | null
    valor_anterior: string | null
    valor_novo: string | null
    created_at: string
}

export type PipelineEtapa =
    | "mapeado" | "em_analise" | "contatado" | "interessado" | "negociacao"
    | "aprovado_preta" | "enviado_cliente" | "aprovado_cliente" | "contratado" | "publicado"

export type Lista = {
    id: string
    nome: string
    descricao: string | null
    cliente_id: string | null
    campanha_id: string | null
    criado_por: string | null
    created_at: string
    updated_at: string
}

export type ListaCriador = {
    id: string
    lista_id: string
    influencer_id: string
    etapa: PipelineEtapa
    added_at: string
}

export type Favorito = {
    id: string
    influencer_id: string
    profile_id: string
    created_at: string
}

export type Contrato = {
    id: string
    titulo: string
    conteudo: string | null
    influencer_id: string | null
    campanha_id: string | null
    status: ContratoStatus
    pdf_url: string | null
    pdf_name: string | null
    assinado_em: string | null
    expira_em: string | null
    versao: number
    created_by: string | null
    created_at: string
    updated_at: string
}

export type Mensagem = {
    id: string
    contato_nome: string
    contato_avatar: string | null
    influencer_id: string | null
    conteudo: string
    origem: "contato" | "eu"
    lida: boolean
    created_at: string
}

export type MidiaKit = {
    id: string
    slug: string
    nome: string
    email: string | null
    telefone: string | null
    whatsapp: string | null
    bio: string | null
    avatar_url: string | null
    cover_url: string | null
    cidade: string | null
    estado: string | null
    nichos: string[]
    tema: string
    redes: Record<string, unknown> | null
    portfolio: unknown | null
    pacotes: unknown | null
    publicado: boolean
    cadastrado_por: string | null
    influencer_id: string | null
    created_at: string
    updated_at: string
}

export type BlogPost = {
    id: string
    slug: string
    titulo: string
    resumo: string | null
    conteudo: string | null
    cover_url: string | null
    categoria: string | null
    tags: string[]
    status: BlogStatus
    autor_id: string | null
    destaque: boolean
    // Separado de publicado_em de propósito: agendar um post que já esteve no
    // ar não pode apagar a data em que ele foi publicado da primeira vez.
    agendado_para: string | null
    publicado_em: string | null
    created_at: string
    updated_at: string
}

/** Catálogo de categorias do blog — editável pela tela de publicações. */
export type BlogCategoria = {
    id: string
    nome: string
    slug: string
    /** Token da paleta (terracota, oliva, info...), não um hex. */
    cor: string
    ordem: number
    created_at: string
}

/** Retorno de somos_preta_blog_metricas(): audiência por post. */
export type BlogMetrica = {
    post_id: string
    total: number
    mes_atual: number
    mes_anterior: number
}

/** Área da PRETA — organiza as tarefas e colore os blocos do calendário. */
export type Area = {
    id: string
    nome: string
    slug: string
    /** Token da paleta (terracota, sucesso, info...), não um hex. */
    cor: string
    ordem: number
    created_at: string
}

/**
 * Linha do feed de atividade do painel.
 *
 * Separada de somos_preta_tarefa_eventos porque aquela tem tarefa_id NOT NULL e
 * só descreve campos de tarefa; aqui entram cliente, campanha, criador e contrato.
 */
export type Atividade = {
    id: string
    entidade: string
    entidade_id: string | null
    tipo: string
    autor_id: string | null
    resumo: string
    created_at: string
}

export type ClienteNota = {
    id: string
    cliente_id: string
    conteudo: string
    autor_id: string | null
    created_at: string
}

export type ClienteArquivo = {
    id: string
    cliente_id: string
    nome: string
    tipo: TarefaAnexoTipo
    storage_path: string | null
    link_externo: string | null
    autor_id: string | null
    created_at: string
}

/** Retorno de somos_preta_tarefa_metricas(). */
export type TarefaMetrica = {
    tarefa_id: string
    subtarefas_total: number
    subtarefas_concluidas: number
    comentarios: number
    anexos: number
}

/** Retorno de somos_preta_campanha_metricas(). */
export type CampanhaMetrica = {
    campanha_id: string
    tarefas_pendentes: number
    tarefas_vencidas: number
    proxima_entrega: string | null
    creators_mapeados: number
    creators_aprovados: number
}
