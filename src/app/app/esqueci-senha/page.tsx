import { EsqueciSenhaForm } from "@/components/auth/esqueci-senha-form"

export default function EsqueciSenhaPage() {
    return <EsqueciSenhaForm loginHref="/app/login" redefinirPath="/app/redefinir-senha" />
}
