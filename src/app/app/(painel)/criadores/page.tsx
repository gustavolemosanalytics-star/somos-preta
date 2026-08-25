import { Suspense } from "react"
import { CriadoresShell } from "./criadores-shell"

export default function CriadoresPage() {
    return (
        <Suspense fallback={<div className="py-16 text-center text-muted-foreground">Carregando...</div>}>
            <CriadoresShell />
        </Suspense>
    )
}
