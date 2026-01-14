import React from 'react';

export function BrutalistLoader() {
    return (
        <div className="flex flex-col items-center justify-center gap-6 p-8">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <div className="absolute inset-4 rounded-full border-4 border-accent/20"></div>
                <div className="absolute inset-4 rounded-full border-4 border-accent border-t-transparent animate-spin [animation-direction:reverse]"></div>
            </div>
            <div className="text-sm font-bold tracking-widest text-muted-foreground animate-pulse uppercase">
                Loading...
            </div>
        </div>
    );
}
