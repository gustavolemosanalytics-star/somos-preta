import { redirect } from "next/navigation"

/**
 * Rota antiga do detalhe do cliente.
 *
 * A tela de clientes passou a trazer o painel de detalhe embutido, abaixo da
 * lista — é lá que estão notas, arquivos, tarefas, responsável e favoritos.
 * Esta rota tinha uma versão paralela e mais pobre da mesma conta: quem chegava
 * por um link vindo de campanha, tarefa ou do feed de atividade via metade da
 * informação e nenhuma forma de editar.
 *
 * Em vez de manter as duas, o link continua funcionando e abre a conta certa
 * já selecionada na tela nova.
 */
export default async function ClienteRedirect({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    redirect(`/clientes?aberto=${id}`)
}
