import { RedefinirSenhaForm } from "@/components/auth/redefinir-senha-form"

export default function CriadorRedefinirSenhaPage() {
    return <RedefinirSenhaForm loginHref="/creator/login" esqueciHref="/creator/esqueci-senha" />
}
