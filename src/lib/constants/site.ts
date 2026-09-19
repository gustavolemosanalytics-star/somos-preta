/**
 * Endereço público do site, usado por robots, sitemap e metadata de
 * compartilhamento. Pode ser sobrescrito por ambiente (preview, staging).
 */
export const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://www.somospreta.com"

/*
 * Não existe mais uma constante com o endereço do painel.
 *
 * Ela servia para os saltos do site para plataforma.somospreta.com — e eram
 * justamente esses saltos que faziam o login do criador piscar a área dele e
 * terminar no painel da equipe. Nenhum caminho de somospreta.com leva ao outro
 * host, então a constante virou só uma arma carregada esperando o próximo uso.
 *
 * O painel continua funcionando no subdomínio: quem o identifica é o
 * middleware, pelo primeiro rótulo do host, sem precisar do endereço completo.
 */
