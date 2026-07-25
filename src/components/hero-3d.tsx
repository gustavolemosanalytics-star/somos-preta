"use client"

import { useMemo, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

function fibonacciSphere(count: number, radius: number) {
    const pts: THREE.Vector3[] = []
    const offset = 2 / count
    const increment = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < count; i++) {
        const y = i * offset - 1 + offset / 2
        const r = Math.sqrt(Math.max(0, 1 - y * y))
        const phi = i * increment
        pts.push(new THREE.Vector3(Math.cos(phi) * r, y, Math.sin(phi) * r).multiplyScalar(radius))
    }
    return pts
}

// Rede neural / grafo de conhecimento — evoca inteligência.
function Network() {
    const group = useRef<THREE.Group>(null)

    const { nodePositions, linePositions } = useMemo(() => {
        const N = 80
        const R = 1.65
        const pts = fibonacciSphere(N, R)

        const nodePositions = new Float32Array(N * 3)
        pts.forEach((p, i) => {
            nodePositions[i * 3] = p.x
            nodePositions[i * 3 + 1] = p.y
            nodePositions[i * 3 + 2] = p.z
        })

        // conecta cada nó aos 2 vizinhos mais próximos
        const segs: number[] = []
        for (let i = 0; i < N; i++) {
            const dists: [number, number][] = []
            for (let j = 0; j < N; j++) if (j !== i) dists.push([pts[i].distanceTo(pts[j]), j])
            dists.sort((a, b) => a[0] - b[0])
            for (let k = 0; k < 2; k++) {
                const j = dists[k][1]
                segs.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z)
            }
        }
        return { nodePositions, linePositions: new Float32Array(segs) }
    }, [])

    useFrame((_, delta) => {
        if (group.current) {
            group.current.rotation.y += delta * 0.16
            group.current.rotation.x += delta * 0.05
        }
    })

    return (
        <group ref={group}>
            <lineSegments>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
                </bufferGeometry>
                <lineBasicMaterial color="#c25a34" transparent opacity={0.28} />
            </lineSegments>
            <points>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[nodePositions, 3]} />
                </bufferGeometry>
                <pointsMaterial color="#c25a34" size={0.07} sizeAttenuation transparent opacity={0.95} />
            </points>
        </group>
    )
}

// Hero 3D discreto — usado só na home institucional.
export default function Hero3D() {
    return (
        <Canvas
            camera={{ position: [0, 0, 4.6], fov: 45 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
            style={{ background: "transparent" }}
        >
            <Network />
        </Canvas>
    )
}
