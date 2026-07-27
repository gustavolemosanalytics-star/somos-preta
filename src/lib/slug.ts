// Gera um slug a partir de um texto (nome do creator, título, etc.)
export function slugify(input: string): string {
    return (input || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "creator"
}
