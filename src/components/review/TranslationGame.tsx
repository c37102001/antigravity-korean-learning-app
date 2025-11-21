import React, { useState, useEffect } from 'react';
import { vocabulary } from '../../data/vocabulary';


export const TranslationGame: React.FC = () => {
    const [mode, setMode] = useState<'typing' | 'choice'>('choice');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [options, setOptions] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    const [score, setScore] = useState(0);

    const currentWord = vocabulary[currentIndex];

    useEffect(() => {
        if (mode === 'choice') {
            generateOptions();
        }
    }, [currentIndex, mode]);

    const generateOptions = () => {
        const otherWords = vocabulary.filter(v => v.id !== currentWord.id);
        const randomDistractor = otherWords[Math.floor(Math.random() * otherWords.length)];
        const newOptions = [currentWord.korean, randomDistractor.korean].sort(() => Math.random() - 0.5);
        setOptions(newOptions);
    };

    const checkAnswer = (answer: string) => {
        if (status !== 'idle') return;

        if (answer === currentWord.korean) {
            setStatus('correct');
            setScore(s => s + 1);
            setTimeout(nextQuestion, 1000);
        } else {
            setStatus('incorrect');
        }
    };

    const nextQuestion = () => {
        setStatus('idle');
        setInput('');
        setCurrentIndex(prev => (prev + 1) % vocabulary.length);
    };

    return (
        <div className="mx-auto max-w-lg">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex gap-2 rounded-lg bg-slate-100 p-1">
                    <button
                        onClick={() => setMode('choice')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'choice' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        選擇題
                    </button>
                    <button
                        onClick={() => setMode('typing')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'typing' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        打字練習
                    </button>
                </div>
                <div className="font-bold text-slate-900">得分: {score}</div>
            </div>

            <div className="mb-8 text-center">
                <div className="text-sm text-slate-500 mb-2">請翻譯成韓文</div>
                <div className="text-4xl font-bold text-slate-900">{currentWord.chinese}</div>
            </div>

            {mode === 'choice' ? (
                <div className="grid gap-4">
                    {options.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => checkAnswer(opt)}
                            disabled={status !== 'idle'}
                            className={`p-6 rounded-xl border-2 text-xl font-bold transition-all ${status === 'correct' && opt === currentWord.korean ? 'border-emerald-500 bg-emerald-50 text-emerald-700' :
                                status === 'incorrect' && opt !== currentWord.korean ? 'opacity-50' :
                                    status === 'incorrect' && opt === currentWord.korean ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : // Show correct answer if wrong
                                        'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                                }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && checkAnswer(input)}
                        placeholder="輸入韓文..."
                        className="w-full rounded-xl border-2 border-slate-200 px-6 py-4 text-xl outline-none focus:border-indigo-500"
                        disabled={status !== 'idle'}
                    />
                    <button
                        onClick={() => checkAnswer(input)}
                        disabled={!input.trim() || status !== 'idle'}
                        className="w-full rounded-xl bg-indigo-600 py-4 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        檢查
                    </button>
                </div>
            )}

            {status === 'incorrect' && (
                <div className="mt-6 text-center animate-bounce">
                    <div className="text-rose-600 font-bold mb-2">答錯了！正確答案是：</div>
                    <div className="text-2xl font-bold text-slate-900">{currentWord.korean}</div>
                    <button onClick={nextQuestion} className="mt-4 text-indigo-600 font-medium hover:underline">
                        下一題
                    </button>
                </div>
            )}
        </div>
    );
};
