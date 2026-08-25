// Tipos das tabelas somos_preta_* (espelham o schema em supabase/migrations/0001_somos_preta_init.sql)

export type Role = "admin" | "gestor" | "analista" | "creator" | "pendente"
export type InfluencerStatus = "ativo" | "inativo" | "negociando" | "bloqueado"
export type CampanhaStatus = "rascunho" | "planejamento" | "ativa" | "concluida" | "cancelada"
export type TarefaStatus =
    | "backlog" | "a_fazer" | "em_andamento" | "aguardando_terceiro"
    | "aguardando_aprovacao" | "bloqueada" | "concluida" | "cancelada"
export type TarefaPrioridade = "baixa" | "media" | "alta" | "urgente"
export type TarefaEventoTipo =
    | "criacao" | "status" | "prioridade" | "prazo" | "responsavel" | "solicitante"
    | "colaborador_adicionado" | "colaborador_removido" | "conclusao" | "reabertura"
export type TarefaComentarioTipo = "comentario" | "duvida" | "bloqueio" | "atualizacao" | "solicitacao_revisao"
export type TarefaAnexoTipo = "imagem" | "pdf_documento" | "video" | "link"
export type NotificacaoTipo = "tarefa_atribuida" | "mencao" | "comentario" | "solicitacao_revisao" | "conclusao"
export type ContratoStatus = "pendente" | "assinado" | "expirado" | "cancelado"
export type BlogStatus = "rascunho" | "publicado"

export type Profile = {
    id: string
    nome: string | null
    email: string | null
    avatar_url: string | null
    role: Role
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
    observacoes: string | null
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
    nicho: string[]
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
    publicado_em: string | null
    created_at: string
    updated_at: string
}
