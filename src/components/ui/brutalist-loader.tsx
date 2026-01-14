import React from 'react';

export function BrutalistLoader() {
    return (
        <div className="flex flex-col items-center justify-center gap-6 p-8">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-primary/10"></div>
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                <div className="absolute inset-4 rounded-full border-2 border-accent/10"></div>
                <div className="absolute inset-4 rounded-full border-2 border-accent border-t-transparent animate-spin [animation-direction:reverse]"></div>
            </div>
            <div className="text-sm font-thin tracking-widest text-muted-foreground animate-pulse uppercase">
                Loading...
            </div>
        </div>
    );
}
