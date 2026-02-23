export function BrutalistLoader() {
    return (
        <div className="flex flex-col items-center justify-center gap-8 p-8">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-pop-red rounded-full border-2 border-black brutal-shadow-sm animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-8 h-8 bg-pop-yellow border-2 border-black brutal-shadow-sm animate-bounce [animation-delay:-0.15s]"></div>
                <div className="animate-bounce">
                    <div className="w-8 h-8 bg-pop-purple border-2 border-black brutal-shadow-sm rotate-45"></div>
                </div>
            </div>
            <div className="text-xl font-black tracking-widest animate-pulse">NOW LOADING...</div>
        </div>
    );
}
