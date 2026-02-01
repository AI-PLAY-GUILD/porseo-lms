import { cn } from "@/lib/utils";
import Link from "next/link";

interface WaveButtonProps {
    href?: string;
    text: string;
    hoverText: string;
    className?: string;
    variant?: "primary" | "secondary";
    onClick?: () => void;
}

export function WaveButton({ href, text, hoverText, className, variant = "primary", onClick }: WaveButtonProps) {
    // Base styles
    const baseStyles = "overflow-hidden relative w-40 p-2 h-12 border-none rounded-md text-base font-bold cursor-pointer z-10 group shadow-md";

    // Variant styles
    const variantStyles = variant === "primary"
        ? "bg-black text-white"
        : "bg-white text-black border-2 border-black";

    const ButtonContent = () => (
        <button
            className={cn(baseStyles, variantStyles, className)}
            onClick={onClick}
            type="button"
        >
            <span className="relative z-10 group-hover:opacity-0 transition-opacity duration-300 block">
                {text}
            </span>
            <span className="absolute w-[600px] h-[600px] -top-20 -left-12 bg-sky-200 rotate-12 transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-500 duration-1000 origin-right"></span>
            <span className="absolute w-[600px] h-[600px] -top-20 -left-12 bg-sky-400 rotate-12 transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-700 duration-700 origin-right"></span>
            <span className="absolute w-[600px] h-[600px] -top-20 -left-12 bg-sky-600 rotate-12 transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-1000 duration-500 origin-right"></span>
            <span className={cn(
                "group-hover:opacity-100 group-hover:duration-1000 duration-100 opacity-0 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 whitespace-nowrap",
                // Hover text is always white because the background becomes blue
                "text-white"
            )}>
                {hoverText}
            </span>
        </button>
    );

    if (href) {
        return (
            <Link href={href}>
                <ButtonContent />
            </Link>
        );
    }

    return <ButtonContent />;
}
