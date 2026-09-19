"use client"

import type { ReactNode } from "react"
import {
    DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors,
    type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
    SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Lista reordenável por arraste e por teclado.
 *
 * A ordem daqui é exatamente a ordem em que a marca vê os itens na página
 * pública — o primeiro trabalho do portfólio é a primeira impressão. Antes só
 * existia a ordem de inserção, e mudar de ideia significava apagar tudo e
 * recriar na ordem certa.
 *
 * É o primeiro uso de @dnd-kit/sortable no repositório; os sensores seguem o
 * que o board de tarefas já estabeleceu (distance 6, senão qualquer toque vira
 * início de arraste e os botões de dentro do item nunca disparam).
 */

export function ListaOrdenavel<T extends { id: string }>({
    itens,
    onReordenar,
    children,
    className,
    rotulo,
}: {
    itens: T[]
    onReordenar: (novos: T[]) => void
    /** Recebe o item e a alça já pronta para ser colocada onde fizer sentido. */
    children: (item: T, indice: number, alca: ReactNode) => ReactNode
    className?: string
    /** Usado no anúncio para leitor de tela: "trabalho", "pacote". */
    rotulo: string
}) {
    const sensores = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    function aoSoltar(evento: DragEndEvent) {
        const { active, over } = evento
        if (!over || active.id === over.id) return

        const de = itens.findIndex((i) => i.id === active.id)
        const para = itens.findIndex((i) => i.id === over.id)
        if (de < 0 || para < 0) return

        onReordenar(arrayMove(itens, de, para))
    }

    return (
        <DndContext
            sensors={sensores}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={aoSoltar}
            accessibility={{
                // Sem isto o leitor de tela emenda o rótulo em português com o
                // parágrafo de instruções padrão do dnd-kit, que vem em inglês
                // — e é justamente ele que explica que a barra de espaço
                // levanta o item e o Esc cancela.
                screenReaderInstructions: {
                    draggable:
                        "Para reordenar, aperte a barra de espaço ou Enter com o foco na alça. " +
                        "Use as setas para mover o item. Aperte a barra de espaço de novo para soltar, " +
                        "ou Esc para cancelar.",
                },
                announcements: {
                    onDragStart: ({ active }) => `Pegou o ${rotulo} na posição ${itens.findIndex((i) => i.id === active.id) + 1} de ${itens.length}.`,
                    onDragOver: ({ over }) =>
                        over ? `Sobre a posição ${itens.findIndex((i) => i.id === over.id) + 1} de ${itens.length}.` : undefined,
                    onDragEnd: ({ over }) =>
                        over ? `Movido para a posição ${itens.findIndex((i) => i.id === over.id) + 1} de ${itens.length}.` : "Arraste cancelado.",
                    onDragCancel: () => "Arraste cancelado — o item voltou ao lugar.",
                },
            }}
        >
            <SortableContext items={itens.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <ul className={cn("space-y-4", className)}>
                    {itens.map((item, indice) => (
                        <ItemOrdenavel key={item.id} id={item.id} rotulo={rotulo}>
                            {(alca) => children(item, indice, alca)}
                        </ItemOrdenavel>
                    ))}
                </ul>
            </SortableContext>
        </DndContext>
    )
}

function ItemOrdenavel({
    id,
    rotulo,
    children,
}: {
    id: string
    rotulo: string
    children: (alca: ReactNode) => ReactNode
}) {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
        useSortable({ id })

    const alca = (
        <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label={`Reordenar ${rotulo}. Use as setas para mover.`}
            title="Arraste para reordenar"
            // Sem override de tamanho: a alça é o único jeito de reordenar no
            // toque, então ela fica com os 44px que o globals.css garante.
            className="shrink-0 cursor-grab touch-none rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
            {...attributes}
            {...listeners}
        >
            <GripVertical className="h-4 w-4" aria-hidden />
        </button>
    )

    return (
        <li
            ref={setNodeRef}
            // O transform é montado à mão em vez de vir do CSS.Translate de
            // @dnd-kit/utilities: aquele pacote é dependência transitiva do
            // /sortable, não está no nosso package.json, e depender de hoisting
            // do npm para o build passar é armadilha para o próximo deploy.
            style={{
                transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
                transition,
            }}
            className={cn(
                "list-none",
                // A sombra forte só existe durante o arraste: é ela que tira o
                // cartão do plano da página e diz "isto está na sua mão".
                isDragging && "relative z-10 rotate-[0.6deg] shadow-[0_24px_60px_-28px_rgba(31,31,31,0.55)]",
            )}
        >
            {children(alca)}
        </li>
    )
}
