import { InfluencerForm } from "@/components/influencers/influencer-form"

export default function NewInfluencerPage() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Novo Influenciador</h2>
                    <p className="text-muted-foreground">
                        Cadastre um novo influenciador na sua base.
                    </p>
                </div>
            </div>
            <div className="mx-auto w-full max-w-4xl rounded-xl border bg-card text-card-foreground shadow p-6">
                <InfluencerForm />
            </div>
        </div>
    )
}
