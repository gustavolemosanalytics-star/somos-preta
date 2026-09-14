import type { BlogPost } from "@/lib/db/types"

/** Autor resolvido pelo join com somos_preta_profiles. */
export type AutorResumo = {
    nome: string | null
    email: string | null
    avatar_url: string | null
}

/**
 * O post como a listagem o carrega: sem `conteudo`.
 *
 * O texto integral de dezenas de posts é o item mais pesado da tabela e não
 * aparece em lugar nenhum da tela — só é buscado quando o editor abre um post
 * para editar.
 */
export type PostDaLista = Omit<BlogPost, "conteudo"> & {
    autor: AutorResumo | null
}

/**
 * Data que representa o post na lista: a de publicação, a do agendamento ou,
 * para quem nunca saiu do rascunho, a de criação. É por ela que a tabela ordena
 * e que o filtro de período decide.
 */
export function dataRelevante(p: PostDaLista) {
    return p.publicado_em ?? p.agendado_para ?? p.created_at
}
