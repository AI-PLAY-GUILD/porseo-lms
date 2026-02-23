"use client";

import { ContactShadows, Environment, Float, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function FloatingVideoCard({
    position,
    rotation,
    color,
    delay,
}: {
    position: [number, number, number];
    rotation: [number, number, number];
    color: string;
    delay: number;
}) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.getElapsedTime();
        // Gentle bobbing and rotation independent of Float
        meshRef.current.position.y += Math.sin(t * 0.5 + delay) * 0.002;
        meshRef.current.rotation.x = rotation[0] + Math.sin(t * 0.3 + delay) * 0.1;
        meshRef.current.rotation.y = rotation[1] + Math.cos(t * 0.2 + delay) * 0.1;
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <group position={position} rotation={rotation}>
                {/* Main Card */}
                <mesh ref={meshRef}>
                    <boxGeometry args={[3, 2, 0.2]} />
                    <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
                </mesh>

                {/* Play Button Icon (Triangle) */}
                <mesh position={[0, 0, 0.15]} rotation={[0, 0, -Math.PI / 2]}>
                    <coneGeometry args={[0.4, 0.8, 3]} />
                    <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
                </mesh>

                {/* Border/Frame */}
                <lineSegments position={[0, 0, 0]}>
                    <edgesGeometry args={[new THREE.BoxGeometry(3, 2, 0.2)]} />
                    <lineBasicMaterial color="black" linewidth={2} />
                </lineSegments>
            </group>
        </Float>
    );
}

function CentralObject() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.getElapsedTime();
        meshRef.current.rotation.x = t * 0.2;
        meshRef.current.rotation.y = t * 0.3;
    });

    return (
        <Float speed={4} rotationIntensity={1} floatIntensity={1}>
            <mesh ref={meshRef} position={[0, 0, -2]}>
                <icosahedronGeometry args={[2.5, 0]} />
                <meshStandardMaterial color="#1a1a1a" wireframe={true} emissive="#0000ff" emissiveIntensity={0.8} />
            </mesh>
        </Float>
    );
}

function Scene() {
    // Generate random positions using useMemo to keep them stable
    const cards = useMemo(() => {
        const items = [];
        const colors = ["#FF5757", "#FFDE59", "#8B5CF6", "#39FF14", "#1a1a1a"]; // Pop colors

        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 12;
            const y = (Math.random() - 0.5) * 10;
            const z = (Math.random() - 0.5) * 6;
            const rotX = (Math.random() - 0.5) * Math.PI * 0.5;
            const rotY = (Math.random() - 0.5) * Math.PI * 0.5;
            const rotZ = (Math.random() - 0.5) * Math.PI * 0.2;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const delay = Math.random() * 10;

            items.push({
                position: [x, y, z] as [number, number, number],
                rotation: [rotX, rotY, rotZ] as [number, number, number],
                color,
                delay,
            });
        }
        return items;
    }, []);

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 18]} fov={50} />
            <ambientLight intensity={0.8} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={1} color="#8B5CF6" />

            <CentralObject />

            {cards.map((card, i) => (
                <FloatingVideoCard
                    key={i}
                    position={card.position}
                    rotation={card.rotation}
                    color={card.color}
                    delay={card.delay}
                />
            ))}

            <ContactShadows position={[0, -6, 0]} opacity={0.4} scale={20} blur={2.5} far={10} />
            <Environment preset="city" />
        </>
    );
}

export function Showcase3D() {
    return (
        <div className="w-full h-full relative min-h-[500px]">
            <Canvas dpr={[1, 2]} gl={{ alpha: true }} style={{ width: "100%", height: "100%" }}>
                <Scene />
            </Canvas>
            {/* Overlay Gradient for fade effect if needed */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-l from-transparent via-transparent to-white/10 lg:to-white/50" />
        </div>
    );
}
