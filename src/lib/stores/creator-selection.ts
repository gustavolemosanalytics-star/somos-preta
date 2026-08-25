import { create } from "zustand"

type CreatorSelectionState = {
    selecionados: string[]
    toggle: (id: string) => void
    limpar: () => void
    definir: (ids: string[]) => void
}

export const useCreatorSelection = create<CreatorSelectionState>((set) => ({
    selecionados: [],
    toggle: (id) =>
        set((s) => ({
            selecionados: s.selecionados.includes(id)
                ? s.selecionados.filter((x) => x !== id)
                : [...s.selecionados, id],
        })),
    limpar: () => set({ selecionados: [] }),
    definir: (ids) => set({ selecionados: ids }),
}))
