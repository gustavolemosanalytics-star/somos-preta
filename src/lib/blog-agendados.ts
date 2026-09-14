/**
 * Publicação dos posts cujo agendamento venceu.
 *
 * O projeto não tem pg_cron nem job agendado, então quem faz o relógio andar é
 * quem chega: toda rota pública que lê posts passa por aqui antes de consultar.
 * Sem isso, um post agendado só entraria no ar quando alguém abrisse /blog —
 * link direto, home e sitemap continuariam sem ele.
 *
 * As rotas públicas leem cookies (o cliente Supabase do servidor precisa deles),
 * o que as torna dinâmicas: o `revalidate = 60` declarado nelas não tem efeito e
 * cada visita renderiza de novo. Por isso a trava de tempo abaixo — sem ela,
 * cada visita anônima abriria uma transação de UPDATE no banco.
 *
 * A trava vale por instância do servidor: em ambiente serverless, instâncias
 * novas recomeçam do zero. É um limitador de custo, não uma garantia de
 * exclusividade — e não precisa ser, porque a RPC é idempotente.
 *
 * Quando houver cron (Vercel Cron ou pg_cron chamando
 * somos_preta_blog_publicar_agendados), este acoplamento com o render pode sair.
 */

type ClienteRpc = {
    rpc: (nome: string, args?: Record<string, unknown>) => PromiseLike<unknown>
}

const INTERVALO_MS = 60_000

let ultimaChamada = 0

export async function publicarAgendados(supabase: ClienteRpc) {
    const agora = Date.now()
    if (agora - ultimaChamada < INTERVALO_MS) return
    ultimaChamada = agora

    // Falha em silêncio: se a migration 0018 ainda não foi aplicada, a RPC não
    // existe — e isso não pode derrubar a página que o visitante pediu.
    try {
        await supabase.rpc("somos_preta_blog_publicar_agendados")
    } catch {
        // ignorado de propósito
    }
}
