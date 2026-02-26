export function BrutalistLoader() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
            <div className="relative">
                <div className="relative w-32 h-32">
                    <div
                        className="absolute w-full h-full rounded-full border-[3px] border-gray-100 border-r-blue-500 border-b-blue-500 animate-spin"
                        style={{ animationDuration: "3s" }}
                    ></div>

                    <div
                        className="absolute w-full h-full rounded-full border-[3px] border-gray-100 border-t-sky-400 animate-spin"
                        style={{ animationDuration: "2s", animationDirection: "reverse" }}
                    ></div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-sky-400/5 animate-pulse rounded-full blur-sm"></div>
            </div>
        </div>
    );
}
