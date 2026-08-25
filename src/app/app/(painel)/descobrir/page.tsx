import { redirect } from "next/navigation"

export default function DescobrirRedirect() {
    redirect("/app/criadores?tab=explorar")
}
