"use client";

import { useEffect, useRef } from "react";

export function LiquidBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let time = 0;
        let width = window.innerWidth;
        let height = window.innerHeight;

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);
            time += 0.005;

            // Background fill
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, "#f0f4ff");
            gradient.addColorStop(1, "#dbe9ff");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Draw waves
            const drawWave = (yOffset: number, amplitude: number, frequency: number, speed: number, color: string) => {
                ctx.beginPath();
                ctx.moveTo(0, height);
                for (let x = 0; x <= width; x += 10) {
                    const y = Math.sin(x * frequency + time * speed) * amplitude + Math.sin(x * frequency * 0.5 + time * speed * 1.5) * (amplitude * 0.5) + yOffset;
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                ctx.fillStyle = color;
                ctx.fill();
            };

            // Multiple layers of waves for "silk" effect
            drawWave(height * 0.6, 50, 0.003, 2, "rgba(68, 221, 255, 0.1)");
            drawWave(height * 0.65, 60, 0.002, 3, "rgba(0, 85, 255, 0.1)");
            drawWave(height * 0.7, 40, 0.004, 1.5, "rgba(19, 91, 236, 0.15)");
            drawWave(height * 0.75, 55, 0.0025, 2.5, "rgba(68, 221, 255, 0.2)");
            drawWave(height * 0.8, 45, 0.0035, 2, "rgba(0, 85, 255, 0.25)");

            requestAnimationFrame(animate);
        };

        const animationId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0 w-full h-full object-cover"
        />
    );
}
