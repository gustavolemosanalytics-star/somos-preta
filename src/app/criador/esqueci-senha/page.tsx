import { EsqueciSenhaForm } from "@/components/auth/esqueci-senha-form"

export default function CriadorEsqueciSenhaPage() {
    return (
        <EsqueciSenhaForm loginHref="/criador/login" redefinirPath="/criador/redefinir-senha" />
    )
}
