import { RedefinirSenhaForm } from "@/components/auth/redefinir-senha-form"

export default function RedefinirSenhaPage() {
    return <RedefinirSenhaForm loginHref="/app/login" esqueciHref="/app/esqueci-senha" />
}
