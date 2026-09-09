import { RedefinirSenhaForm } from "@/components/auth/redefinir-senha-form"

export default function CriadorRedefinirSenhaPage() {
    return <RedefinirSenhaForm loginHref="/criador/login" esqueciHref="/criador/esqueci-senha" />
}
