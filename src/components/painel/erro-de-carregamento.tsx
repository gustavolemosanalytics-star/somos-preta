"use client"

import { RotateCw, WifiOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

/**
 * O que a tela mostra quando a LEITURA falhou.
 *
 * Existe para não confundir com o estado vazio. "Nenhum contrato ainda" e "não
 * consegui ler os contratos" pedem reações opostas: a primeira convida a
 * cadastrar — e quem seguir o convite depois de uma sessão expirada acaba
 * duplicando o que já existia.
 */
export function ErroDeCarregamento({ recurso, onTentarDeNovo }: {
    /** No plural e em minúscula: "os contratos", "as campanhas". */
    recurso: string
    onTentarDeNovo: () => void
}) {
    return (
        <Card className="border-status-erro/30">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                <WifiOff className="h-9 w-9 text-status-erro/50" aria-hidden />
                <div>
                    <p className="font-medium">Não foi possível carregar {recurso}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Pode ser a conexão ou a sua sessão ter expirado. Nada foi perdido.
                    </p>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={onTentarDeNovo}>
                    <RotateCw className="h-3.5 w-3.5" /> Tentar de novo
                </Button>
            </CardContent>
        </Card>
    )
}
