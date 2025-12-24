import { BrutalistLoader } from "@/components/ui/brutalist-loader";

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-cream">
            <BrutalistLoader />
        </div>
    );
}
