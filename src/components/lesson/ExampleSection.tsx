import React from 'react';
import type { Example } from '../../types';
import { Volume2 } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';

interface ExampleSectionProps {
    examples: Example[];
}

export const ExampleSection: React.FC<ExampleSectionProps> = ({ examples }) => {
    const { playAudio } = useAudio();

    return (
        <div className="mb-8">
            <h3 className="mb-4 text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-700">Ex</span>
                例句
            </h3>
            <div className="grid gap-3 sm:grid-cols-1">
                {examples.map((ex, i) => (
                    <div
                        key={i}
                        onClick={() => playAudio(ex.korean)}
                        className="group relative flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md cursor-pointer active:scale-[0.99]"
                    >
                        <div>
                            <div className="text-lg font-medium text-slate-900 mb-1">{ex.korean}</div>
                            <div className="text-slate-500">{ex.chinese}</div>
                        </div>
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-600"
                        >
                            <Volume2 className="h-5 w-5" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};