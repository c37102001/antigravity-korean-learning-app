import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ArrowRight, Star } from 'lucide-react';
import type { ReviewItem } from '../../types';

interface ListeningGameProps {
    items: ReviewItem[];
    mode?: 'sequential' | 'random';
    title?: string;
    autoAudio?: boolean;
    onToggleStar?: (id: string, isStarred: boolean) => void;
}

export const ListeningGame: React.FC<ListeningGameProps> = ({ items, mode = 'random', title = '聽力練習', autoAudio = true, onToggleStar }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [shuffledItems, setShuffledItems] = useState<ReviewItem[]>([]);
    const [options, setOptions] = useState<ReviewItem[]>([]);
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
        prevModeRef.current = mode;
    }, [items, mode]);

    const currentItem = shuffledItems[currentIndex];

    useEffect(() => {
        if (currentItem) {
            const others = items
                .filter(i => i.id !== currentItem.id)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);

            setOptions([...others, currentItem].sort(() => Math.random() - 0.5));

            if (autoAudio) {
                const timer = setTimeout(() => playAudio(currentItem.audio), 500);
                return () => clearTimeout(timer);
            }
        }
    }, [currentItem, items, autoAudio]);

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

    const checkAnswer = (selectedId: string) => {
        const correct = selectedId === currentItem.id;
        setIsCorrect(correct);
        setShowResult(true);
    };

    const nextQuestion = () => {
        setShowResult(false);
        setIsCorrect(false);
        setCurrentIndex((prev) => (prev + 1) % shuffledItems.length);
    };

    const promptLabel = currentItem.front === currentItem.audio ? '請聽韓文，選出正確的韓文內容' : '請聽韓文，選出正確的意思';

    return (
        <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center relative">
                {onToggleStar && currentItem && (
                    <button
                        onClick={() => onToggleStar(currentItem.id, currentItem.isStarred || false)}
                        className={`absolute top-0 right-0 p-2 rounded-full hover:bg-yellow-50 ${currentItem.isStarred ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
                    >
                        <Star className={`h-6 w-6 ${currentItem.isStarred ? 'fill-current' : ''}`} />
                    </button>
                )}
                <h2 className="text-2xl font-bold text-slate-900">{title} ({currentIndex + 1}/{shuffledItems.length})</h2>
                <p className="text-slate-500">{promptLabel}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
                <div className="mb-8 flex justify-center">
                    <button
                        onClick={() => playAudio(currentItem.audio)}
                        className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition-all hover:scale-110 hover:bg-indigo-200 hover:shadow-lg"
                    >
                        <Volume2 className="h-10 w-10" />
                    </button>
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
                            <div className="mb-6 text-lg">
                                正確答案：<span className="font-bold">{currentItem.front}</span>
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
                            className="grid gap-3"
                        >
                            {options.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => checkAnswer(option.id)}
                                    className="rounded-xl border-2 border-slate-100 p-4 text-lg font-medium text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50"
                                >
                                    {option.front}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
