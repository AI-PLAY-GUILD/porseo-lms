"use client";

import { useEffect, useRef } from "react";

export function GalaxyAnimation() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        let stars: Star[] = [];
        const STAR_COUNT = 400; // Reduced count for cleaner look
        const SPEED = 0.2; // Slower, more majestic speed

        canvas.width = width;
        canvas.height = height;

        class Star {
            x: number;
            y: number;
            z: number;
            prevZ: number;
            color: string;

            constructor() {
                this.x = (Math.random() - 0.5) * width * 2;
                this.y = (Math.random() - 0.5) * height * 2;
                this.z = Math.random() * width;
                this.prevZ = this.z;
                // Random subtle colors for stars
                const colors = ["#ffffff", "#ffe9c4", "#d4fbff"];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }

            update() {
                this.prevZ = this.z;
                this.z -= SPEED * 20;

                if (this.z < 1) {
                    this.z = width;
                    this.prevZ = this.z;
                    this.x = (Math.random() - 0.5) * width * 2;
                    this.y = (Math.random() - 0.5) * height * 2;
                }
            }

            draw() {
                if (!ctx) return;

                const sx = (this.x / this.z) * (width / 2) + width / 2;
                const sy = (this.y / this.z) * (height / 2) + height / 2;

                // Don't draw trails, just draw stars for a cleaner "Superwall" look
                // Or very subtle trails

                if (sx < 0 || sx > width || sy < 0 || sy > height) return;

                const radius = (1 - this.z / width) * 1.5;
                const alpha = 1 - this.z / width;

                ctx.beginPath();
                ctx.arc(sx, sy, radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.globalAlpha = alpha;
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }

        const init = () => {
            stars = Array.from({ length: STAR_COUNT }, () => new Star());
        };

        const animate = () => {
            const time = Date.now() * 0.0005; // Slow time factor

            // Create the Superwall-like gradient background
            const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
            gradient.addColorStop(0, "#1a1b26");
            gradient.addColorStop(0.4, "#0f1016");
            gradient.addColorStop(1, "#000000");

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Add some "nebula" glow spots
            const drawGlow = (x: number, y: number, radius: number, color: string) => {
                const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
                g.addColorStop(0, color);
                g.addColorStop(1, "transparent");
                ctx.fillStyle = g;
                ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
            };

            // Animated glows
            // Purple glow moving in a slow figure-8
            const purpleX = width * 0.3 + Math.sin(time) * width * 0.1;
            const purpleY = height * 0.4 + Math.cos(time * 0.8) * height * 0.1;
            drawGlow(purpleX, purpleY, width * 0.5, "rgba(120, 50, 200, 0.08)");

            // Blue glow moving in a counter-circle
            const blueX = width * 0.7 + Math.cos(time * 0.7) * width * 0.15;
            const blueY = height * 0.6 + Math.sin(time * 0.6) * height * 0.15;
            drawGlow(blueX, blueY, width * 0.5, "rgba(50, 100, 255, 0.08)");

            // Cyan/Teal glow for extra depth
            const tealX = width * 0.5 + Math.sin(time * 0.5 + 2) * width * 0.2;
            const tealY = height * 0.5 + Math.cos(time * 0.4 + 2) * height * 0.2;
            drawGlow(tealX, tealY, width * 0.4, "rgba(0, 200, 255, 0.05)");

            stars.forEach((star) => {
                star.update();
                star.draw();
            });

            requestAnimationFrame(animate);
        };

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            init();
        };

        window.addEventListener("resize", handleResize);
        init();
        animate();

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full -z-10"
            style={{ background: "#000" }} // Fallback
        />
    );
}
