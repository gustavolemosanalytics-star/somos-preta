import { EsqueciSenhaForm } from "@/components/auth/esqueci-senha-form"

export default function EsqueciSenhaPage() {
    return <EsqueciSenhaForm loginHref="/login" redefinirPath="/redefinir-senha" />
}
