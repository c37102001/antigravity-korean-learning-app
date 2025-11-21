import React, { useState } from 'react';
import type { Exercise } from '../../types';
import { Check, X, HelpCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface PracticeInputProps {
    exercises: Exercise[];
}

export const PracticeInput: React.FC<PracticeInputProps> = ({ exercises }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [input, setInput] = useState('');
    const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    const [showHint, setShowHint] = useState(false);

    const currentExercise = exercises[currentIndex];
    const isLast = currentIndex === exercises.length - 1;

    const checkAnswer = () => {
        if (!input.trim()) return;

        // Simple normalization: remove spaces and lowercase for comparison
        const normalizedInput = input.replace(/\s+/g, '').toLowerCase();
        const normalizedAnswer = currentExercise.answer.replace(/\s+/g, '').toLowerCase();

        if (normalizedInput === normalizedAnswer) {
            setStatus('correct');
        } else {
            setStatus('incorrect');
        }
    };

    const nextExercise = () => {
        if (isLast) return;
        setCurrentIndex(prev => prev + 1);
        setInput('');
        setStatus('idle');
        setShowHint(false);
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">練習題 ({currentIndex + 1}/{exercises.length})</h3>
                <div className="text-sm text-slate-500">
                    {status === 'correct' && <span className="text-emerald-600 font-medium flex items-center gap-1"><Check className="h-4 w-4" /> 正確！</span>}
                    {status === 'incorrect' && <span className="text-rose-600 font-medium flex items-center gap-1"><X className="h-4 w-4" /> 再試一次</span>}
                </div>
            </div>

            <div className="mb-6">
                <div className="text-lg font-medium text-slate-800 mb-2">{currentExercise.question}</div>
                {showHint && currentExercise.hint && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-sm text-amber-600 mb-2"
                    >
                        提示: {currentExercise.hint}
                    </motion.div>
                )}
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        if (status !== 'idle') setStatus('idle');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && status !== 'correct' && checkAnswer()}
                    placeholder="輸入韓文..."
                    className={`flex-1 rounded-xl border px-4 py-3 outline-none transition-all ${status === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' :
                        status === 'incorrect' ? 'border-rose-300 bg-rose-50' :
                            'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                        }`}
                    disabled={status === 'correct'}
                />

                {status === 'correct' ? (
                    !isLast ? (
                        <button
                            onClick={nextExercise}
                            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white transition-colors hover:bg-indigo-700"
                        >
                            下一題 <ArrowRight className="h-5 w-5" />
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 rounded-xl bg-emerald-100 px-6 py-3 font-bold text-emerald-700">
                            完成 <Check className="h-5 w-5" />
                        </div>
                    )
                ) : (
                    <button
                        onClick={checkAnswer}
                        disabled={!input.trim()}
                        className="rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                    >
                        檢查
                    </button>
                )}
            </div>

            {status !== 'correct' && currentExercise.hint && (
                <button
                    onClick={() => setShowHint(!showHint)}
                    className="mt-4 flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600"
                >
                    <HelpCircle className="h-4 w-4" />
                    {showHint ? '隱藏提示' : '顯示提示'}
                </button>
            )}
        </div>
    );
};
