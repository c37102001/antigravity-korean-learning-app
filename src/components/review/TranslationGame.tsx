import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ArrowRight, Keyboard, MousePointer2, Star } from 'lucide-react';
import type { ReviewItem } from '../../types';

interface TranslationGameProps {
    items: ReviewItem[];
    mode?: 'sequential' | 'random';
    title?: string;
    autoAudio?: boolean;
    onToggleStar?: (id: string, isStarred: boolean) => void;
}

export const TranslationGame: React.FC<TranslationGameProps> = ({ items, mode = 'random', title = '翻譯練習', autoAudio = true, onToggleStar }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [input, setInput] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [gameMode, setGameMode] = useState<'typing' | 'choice'>('choice');
    const [shuffledItems, setShuffledItems] = useState<ReviewItem[]>([]);
    const [options, setOptions] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const prevModeRef = useRef<'sequential' | 'random'>(mode);

    useEffect(() => {
        const modeChanged = prevModeRef.current !== mode;
        const previousItems = shuffledItems;
        const previousCurrentId = previousItems[currentIndex]?.id;

        let nextItems: ReviewItem[];

        if (mode === 'random') {
            if (modeChanged || previousItems.length === 0) {
                nextItems = [...items].sort(() => Math.random() - 0.5);
            } else {
                const incomingById = new Map(items.map(item => [item.id, item]));
                const preservedItems = previousItems
                    .filter(item => incomingById.has(item.id))
                    .map(item => incomingById.get(item.id)!);
                const preservedIds = new Set(preservedItems.map(item => item.id));
                const newItems = items
                    .filter(item => !preservedIds.has(item.id))
                    .sort(() => Math.random() - 0.5);
                nextItems = [...preservedItems, ...newItems];
            }
        } else {
            nextItems = items;
        }

        let nextIndex = 0;
        if (!modeChanged && nextItems.length > 0) {
            if (previousCurrentId) {
                const existingIndex = nextItems.findIndex(item => item.id === previousCurrentId);
                nextIndex = existingIndex !== -1 ? existingIndex : Math.min(currentIndex, nextItems.length - 1);
            } else {
                nextIndex = Math.min(currentIndex, nextItems.length - 1);
            }
        }

        setShuffledItems(nextItems);
        setCurrentIndex(nextItems.length > 0 ? nextIndex : 0);
        setShowResult(false);
        setInput('');
        prevModeRef.current = mode;
    }, [items, mode]);

    const currentItem = shuffledItems[currentIndex];

    useEffect(() => {
        if (currentItem && gameMode === 'choice') {
            const others = items
                .filter(i => i.id !== currentItem.id)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map(i => i.back); // Options are Answers (Korean)

            setOptions([...others, currentItem.back].sort(() => Math.random() - 0.5));
        }
    }, [currentItem, gameMode, items]);

    if (!currentItem) return <div>載入中...</div>;

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
        const targetVoice = voices.find(v => v.name.includes('Yuna'))
            || voices.find(v => v.lang.includes('ko') || v.lang.includes('KR'));
        if (targetVoice) utterance.voice = targetVoice;

        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (!autoAudio || showResult || currentItem.front !== currentItem.audio) return;

        const timer = setTimeout(() => {
            playAudio(currentItem.audio);
        }, 500);

        return () => clearTimeout(timer);
    }, [autoAudio, currentItem, showResult]);

    const checkAnswer = (answer: string) => {
        const correct = answer.trim().toLowerCase() === currentItem.back.toLowerCase();
        setIsCorrect(correct);
        setShowResult(true);
        if (correct) {
            playAudio(currentItem.audio);
        }
    };

    const nextQuestion = () => {
        setShowResult(false);
        setInput('');
        setIsCorrect(false);
        setCurrentIndex((prev) => (prev + 1) % shuffledItems.length);
    };

    const translateTargetLabel = currentItem.back === currentItem.audio ? '韓文' : '中文';
    const typingPlaceholder = translateTargetLabel === '韓文' ? '輸入韓文...' : '輸入中文...';

    return (
        <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900">{title} ({currentIndex + 1}/{shuffledItems.length})</h2>
                <div className="mt-4 flex justify-center gap-4">
                    <button
                        onClick={() => setGameMode('choice')}
                        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${gameMode === 'choice'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        <MousePointer2 className="h-4 w-4" />
                        選擇題
                    </button>
                    <button
                        onClick={() => setGameMode('typing')}
                        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${gameMode === 'typing'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        <Keyboard className="h-4 w-4" />
                        打字練習
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
                <div className="mb-8 text-center relative">
                    {onToggleStar && currentItem && (
                        <button
                            onClick={() => onToggleStar(currentItem.id, currentItem.isStarred || false)}
                            className={`absolute top-0 right-0 p-2 rounded-full hover:bg-yellow-50 ${currentItem.isStarred ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
                        >
                            <Star className={`h-6 w-6 ${currentItem.isStarred ? 'fill-current' : ''}`} />
                        </button>
                    )}
                    <p className="mb-2 text-sm text-slate-500">請翻譯成{translateTargetLabel}</p>
                    <h3 className="text-3xl font-bold text-slate-900">{currentItem.front}</h3>
                </div>

                <AnimatePresence mode="wait">
                    {showResult ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`rounded-xl p-6 text-center ${isCorrect ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'
                                }`}
                        >
                            <div className="mb-4 text-xl font-bold">
                                {isCorrect ? '答對了！' : '答錯了...'}
                            </div>
                            <div className="mb-6 text-2xl">
                                {currentItem.back}
                                <button
                                    onClick={() => playAudio(currentItem.audio)}
                                    className="ml-2 inline-flex align-middle text-indigo-600 hover:text-indigo-800"
                                >
                                    <Volume2 className="h-6 w-6" />
                                </button>
                            </div>
                            <button
                                onClick={nextQuestion}
                                className="inline-flex items-center rounded-lg bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-indigo-700"
                            >
                                下一題 <ArrowRight className="ml-2 h-5 w-5" />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {gameMode === 'choice' ? (
                                <div className="grid gap-3">
                                    {options.map((option, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => checkAnswer(option)}
                                            className="rounded-xl border-2 border-slate-100 p-4 text-lg font-medium text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50"
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && checkAnswer(input)}
                                        placeholder={typingPlaceholder}
                                        className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 text-lg outline-none focus:border-indigo-500"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => checkAnswer(input)}
                                        className="rounded-xl bg-indigo-600 px-6 font-bold text-white hover:bg-indigo-700"
                                    >
                                        送出
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
