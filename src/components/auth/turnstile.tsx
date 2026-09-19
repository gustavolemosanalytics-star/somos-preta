"use client"

import { useRef, useState } from "react"
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"

/**
 * Desafio Turnstile nos formulários de credencial.
 *
 * Quando NEXT_PUBLIC_TURNSTILE_SITE_KEY não está configurada o componente não
 * renderiza nada e devolve token vazio — mesmo raciocínio do lado servidor:
 * variável esquecida não pode trancar ninguém para fora.
 */
export function useTurnstile() {
    const ref = useRef<TurnstileInstance>(null)
    const [token, setToken] = useState<string | null>(null)
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

    /** Zera o desafio: um token só vale uma vez, e some depois de usado. */
    function reiniciar() {
        setToken(null)
        ref.current?.reset()
    }

    const campo = sitekey ? (
        // O widget tem 300px de largura mínima própria, e a coluna útil dentro
        // do cartão de credencial é ~290px num celular de 360px. A faixa rolável
        // contém o excesso aqui dentro em vez de deixá-lo empurrar a página.
        <div className="w-full overflow-x-auto">
            <Turnstile
                ref={ref}
                siteKey={sitekey}
                onSuccess={setToken}
                onExpire={() => setToken(null)}
                onError={() => setToken(null)}
                options={{ size: "flexible", language: "pt-br" }}
                className="w-full"
            />
        </div>
    ) : null

    return {
        campo,
        token,
        reiniciar,
        /** Sem sitekey não há desafio a cumprir, então o formulário segue. */
        pronto: !sitekey || !!token,
    }
}
