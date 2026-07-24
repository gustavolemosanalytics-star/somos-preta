"use client"

import { Canvas } from "@react-three/fiber"
import { Float, MeshDistortMaterial, Icosahedron } from "@react-three/drei"

function Blob() {
    return (
        <Float speed={1.2} rotationIntensity={0.5} floatIntensity={1.1}>
            <Icosahedron args={[1.5, 12]}>
                <MeshDistortMaterial
                    color="#c25a34"
                    roughness={0.4}
                    metalness={0.05}
                    distort={0.32}
                    speed={1.4}
                />
            </Icosahedron>
        </Float>
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
            <ambientLight intensity={0.7} />
            <directionalLight position={[3, 4, 3]} intensity={1.3} />
            <directionalLight position={[-4, -2, -2]} intensity={0.4} color="#f0b090" />
            <Blob />
        </Canvas>
    )
}
