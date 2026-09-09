"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Color, Mesh, Program, Renderer, Triangle } from "ogl"

import { cn } from "@/lib/utils"

/**
 * Botão com realce especular na borda, adaptado do SpecularButton do React Bits.
 *
 * Diferenças em relação ao original, todas por causa deste projeto:
 * - renderiza <Link> quando recebe `href`, já que os CTAs da landing navegam;
 * - o preenchimento fica por conta das classes do projeto (terracota da marca),
 *   e o canvas entra só como camada de brilho na aresta;
 * - respeita `prefers-reduced-motion`: sem isso o rAF ficaria rodando sempre.
 */

const PAD = 20

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform float uRadius;
uniform float uAngle;
uniform float uPx;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform float uShineSize;
uniform float uShineFade;
uniform float uThickness;
uniform float uBaseWidth;

out vec4 fragColor;

float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float gaussianLine(float d, float sigma) {
  float x = d / (sigma + 1e-6);
  float k = mix(1.0, 1.6, smoothstep(0.0, 1.5, x));
  return exp(-k * x * x);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = sdRoundedRect(p, uHalfSize, uRadius);
  vec2 L = vec2(cos(uAngle), sin(uAngle));

  float base = (1.0 - smoothstep(0.0, uBaseWidth, abs(d))) * 0.45;

  vec2 nEll = normalize(p / (uHalfSize * uHalfSize) + 1e-6);
  float phi = acos(clamp(abs(dot(nEll, L)), 0.0, 1.0));
  float rim = 1.0 - smoothstep(uShineSize - uShineFade, uShineSize + uShineFade + 1e-4, phi);
  float line = gaussianLine(d, uThickness);
  float edgeClamp = 1.0 - smoothstep(0.5 * uPx, 3.0 * uPx, abs(d));
  float hi = line * rim * edgeClamp * uIntensity;

  vec3 col = uBaseColor * base + uLineColor * hi;
  float a = clamp(base + hi, 0.0, 1.0);
  fragColor = vec4(col, a);
}
`

type Props = {
    children: React.ReactNode
    href?: string
    onClick?: React.MouseEventHandler
    className?: string
    /** Raio da borda em px; precisa acompanhar o rounded do botão. */
    radius?: number
    lineColor?: string
    baseColor?: string
    intensity?: number
    shineSize?: number
    shineFade?: number
    thickness?: number
    speed?: number
    proximity?: number
}

export function SpecularButton({
    children,
    href,
    onClick,
    className,
    radius = 999,
    lineColor = "#FFFFFF",
    baseColor = "#B85C42",
    intensity = 1,
    shineSize = 12,
    shineFade = 42,
    thickness = 1.2,
    speed = 0.35,
    proximity = 260,
}: Props) {
    const alvo = useRef<HTMLElement>(null)
    const camada = useRef<HTMLSpanElement>(null)
    const props = useRef({ radius, lineColor, baseColor, intensity, shineSize, shineFade, thickness, speed, proximity })

    // O laço de animação lê estes valores a cada quadro. O original atribuía o
    // ref durante o render; aqui a sincronia acontece em efeito, que é onde o
    // React permite escrever em ref.
    useEffect(() => {
        props.current = { radius, lineColor, baseColor, intensity, shineSize, shineFade, thickness, speed, proximity }
    }, [radius, lineColor, baseColor, intensity, shineSize, shineFade, thickness, speed, proximity])

    useEffect(() => {
        const el = alvo.current
        const fx = camada.current
        if (!el || !fx) return

        // Quem pediu menos movimento não recebe um rAF girando indefinidamente.
        const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)")
        if (semMovimento.matches) return

        const dpr = window.devicePixelRatio || 1
        const renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: true, dpr })
        const gl = renderer.gl
        gl.clearColor(0, 0, 0, 0)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

        const geometry = new Triangle(gl)
        if (geometry.attributes.uv) delete geometry.attributes.uv

        const program = new Program(gl, {
            vertex: VERT,
            fragment: FRAG,
            uniforms: {
                uCenter: { value: [0, 0] },
                uHalfSize: { value: [1, 1] },
                uRadius: { value: 0 },
                uAngle: { value: 2.4 },
                uPx: { value: dpr },
                uLineColor: { value: [1, 1, 1] },
                uBaseColor: { value: [0.32, 0.32, 0.32] },
                uIntensity: { value: 1 },
                uShineSize: { value: 0.17 },
                uShineFade: { value: 0.7 },
                uThickness: { value: 1 },
                uBaseWidth: { value: dpr },
            },
        })

        const mesh = new Mesh(gl, { geometry, program })
        fx.appendChild(gl.canvas)

        const medida = { w: 1, h: 1 }
        const redimensionar = () => {
            const r = el.getBoundingClientRect()
            medida.w = r.width
            medida.h = r.height
            renderer.setSize(r.width + PAD * 2, r.height + PAD * 2)
            program.uniforms.uCenter.value = [(PAD + r.width / 2) * dpr, (PAD + r.height / 2) * dpr]
            program.uniforms.uHalfSize.value = [(r.width / 2) * dpr, (r.height / 2) * dpr]
        }
        const ro = new ResizeObserver(redimensionar)
        ro.observe(el)
        redimensionar()

        let anguloPonteiro: number | null = null
        let proximidade = 0
        const aoMover = (e: PointerEvent) => {
            const r = el.getBoundingClientRect()
            const cx = r.left + r.width / 2
            const cy = r.top + r.height / 2
            const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right)
            const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom)
            const dist = Math.hypot(dx, dy)
            if (dist === 0) {
                const nx = (e.clientX - cx) / (r.width / 2)
                const ny = (cy - e.clientY) / (r.height / 2)
                anguloPonteiro = Math.atan2(2 / r.height, -2 / r.width) + nx * 0.3 + ny * 0.15
            } else {
                anguloPonteiro = Math.atan2(cy - e.clientY, e.clientX - cx)
            }
            const t = Math.max(0, 1 - dist / Math.max(props.current.proximity, 1))
            proximidade = t * t * (3 - 2 * t)
        }
        window.addEventListener("pointermove", aoMover)

        let angulo = 2.4
        let anguloOcioso = 2.4
        let brilho = 0
        let ultimo = performance.now()
        let raf = 0
        const cLinha = new Color()
        const cBase = new Color()

        const passo = (agora: number) => {
            raf = requestAnimationFrame(passo)
            const dt = Math.min((agora - ultimo) / 1000, 0.05)
            ultimo = agora
            const p = props.current

            anguloOcioso += p.speed * dt
            const alvoAng = anguloPonteiro != null ? anguloPonteiro : anguloOcioso
            const dif = ((alvoAng - angulo + Math.PI * 3) % (Math.PI * 2)) - Math.PI
            angulo += dif * (1 - Math.exp(-dt * 7))
            brilho += (proximidade - brilho) * (1 - Math.exp(-dt * 8))

            cLinha.set(p.lineColor)
            cBase.set(p.baseColor)
            program.uniforms.uAngle.value = angulo
            program.uniforms.uRadius.value = Math.min(p.radius, Math.min(medida.w, medida.h) / 2) * dpr
            program.uniforms.uLineColor.value = [cLinha.r, cLinha.g, cLinha.b]
            program.uniforms.uBaseColor.value = [cBase.r, cBase.g, cBase.b]
            program.uniforms.uIntensity.value = p.intensity * brilho
            program.uniforms.uShineSize.value = (p.shineSize * Math.PI) / 180
            program.uniforms.uShineFade.value = (p.shineFade * Math.PI) / 180
            program.uniforms.uThickness.value = p.thickness * dpr
            renderer.render({ scene: mesh })
        }
        raf = requestAnimationFrame(passo)

        return () => {
            cancelAnimationFrame(raf)
            ro.disconnect()
            window.removeEventListener("pointermove", aoMover)
            if (gl.canvas.parentNode === fx) fx.removeChild(gl.canvas)
            gl.getExtension("WEBGL_lose_context")?.loseContext()
        }
    }, [])

    const conteudo = (
        <>
            <span
                ref={camada}
                aria-hidden
                className="pointer-events-none absolute -inset-5 z-[1] [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full"
            />
            <span className="relative z-[2] inline-flex items-center gap-3">{children}</span>
        </>
    )

    const classe = cn("relative isolate active:scale-[0.98] transition-transform", className)

    if (href) {
        return (
            <Link ref={alvo as React.Ref<HTMLAnchorElement>} href={href} className={classe}>
                {conteudo}
            </Link>
        )
    }

    return (
        <button
            ref={alvo as React.Ref<HTMLButtonElement>}
            type="button"
            onClick={onClick}
            className={classe}
        >
            {conteudo}
        </button>
    )
}
