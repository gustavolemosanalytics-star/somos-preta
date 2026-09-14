import { redirect } from "next/navigation"

/**
 * Raiz do subdomínio do painel.
 *
 * Com o painel morando em plataforma.somospreta.com, digitar só o domínio é o
 * caminho mais natural de entrada — e sem esta rota ele respondia 404, porque
 * as telas começam um nível abaixo. O guard de sessão do middleware roda antes,
 * então quem não está logado nem chega aqui.
 */
export default function RaizDaPlataforma() {
    redirect("/dashboard")
}
