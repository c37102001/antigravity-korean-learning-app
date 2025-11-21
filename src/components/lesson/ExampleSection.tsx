import React from 'react';
import type { Example } from '../../types';
import { Volume2 } from 'lucide-react';

interface ExampleSectionProps {
    examples: Example[];
}

export const ExampleSection: React.FC<ExampleSectionProps> = ({ examples }) => {

    // --- 修改開始：優先指定 Yuna 的發音函式 ---
    const playAudio = (text: string) => {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.8;

        let voices = window.speechSynthesis.getVoices();

        if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                voices = window.speechSynthesis.getVoices();
            };
        }

        // 優先找 Yuna
        const targetVoice = voices.find(v => v.name.includes('Yuna'))
            || voices.find(v => v.lang.includes('ko') || v.lang.includes('KR'));

        if (targetVoice) {
            utterance.voice = targetVoice;
        }

        window.speechSynthesis.speak(utterance);
    };
    // --- 修改結束 ---

    return (
        <div className="mb-8">
            <h3 className="mb-4 text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-700">Ex</span>
                例句
            </h3>
            <div className="grid gap-3 sm:grid-cols-1">
                {examples.map((ex, i) => (
                    <div key={i} className="group relative flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                        <div>
                            <div className="text-lg font-medium text-slate-900 mb-1">{ex.korean}</div>
                            <div className="text-slate-500">{ex.chinese}</div>
                        </div>
                        <button
                            onClick={() => playAudio(ex.korean)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                            aria-label="Play audio"
                        >
                            <Volume2 className="h-5 w-5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};