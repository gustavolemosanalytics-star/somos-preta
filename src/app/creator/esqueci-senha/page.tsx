import { EsqueciSenhaForm } from "@/components/auth/esqueci-senha-form"

export default function CriadorEsqueciSenhaPage() {
    return (
        <EsqueciSenhaForm loginHref="/creator/login" redefinirPath="/creator/redefinir-senha" />
    )
}
