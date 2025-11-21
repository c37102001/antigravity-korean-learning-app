import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, RotateCw, ArrowRight, ArrowLeft } from 'lucide-react';
import type { ReviewItem } from '../../types';

interface FlashcardGameProps {
    items: ReviewItem[];
    mode?: 'sequential' | 'random';
    title?: string;
    autoAudio?: boolean;
}

export const FlashcardGame: React.FC<FlashcardGameProps> = ({
    items,
    mode = 'random',
    title = '單字卡',
    autoAudio = true
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [shuffledItems, setShuffledItems] = useState<ReviewItem[]>([]);

    useEffect(() => {
        if (mode === 'random') {
            setShuffledItems([...items].sort(() => Math.random() - 0.5));
        } else {
            setShuffledItems(items);
        }
        setCurrentIndex(0);
        setIsFlipped(false);
    }, [items, mode]);

    // Auto-play audio when card changes (and on mount if items exist)
    useEffect(() => {
        if (autoAudio && shuffledItems.length > 0) {
            const current = shuffledItems[currentIndex];
            // When card changes, we are always at Front side initially
            const lang = current.front === current.audio ? 'ko-KR' : 'zh-TW';

            // Small delay to ensure smooth transition
            const timer = setTimeout(() => {
                playAudio(current.front, lang);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [currentIndex, autoAudio, shuffledItems]);

    if (shuffledItems.length === 0) {
        return <div className="text-center py-10">載入中...</div>;
    }

    const currentCard = shuffledItems[currentIndex];

    const playAudio = (text: string, lang: 'ko-KR' | 'zh-TW') => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;

        if (lang === 'ko-KR') {
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
        }
        window.speechSynthesis.speak(utterance);
    };

    const handleFlip = () => {
        const newFlippedState = !isFlipped;
        setIsFlipped(newFlippedState);

        if (autoAudio) {
            // Play audio for the side we are revealing
            if (newFlippedState) {
                // Revealing Back
                const lang = currentCard.back === currentCard.audio ? 'ko-KR' : 'zh-TW';
                playAudio(currentCard.back, lang);
            } else {
                // Revealing Front
                const lang = currentCard.front === currentCard.audio ? 'ko-KR' : 'zh-TW';
                playAudio(currentCard.front, lang);
            }
        }
    };

    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % shuffledItems.length);
        }, 200);
    };

    const prevCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + shuffledItems.length) % shuffledItems.length);
        }, 200);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900">{title} ({currentIndex + 1}/{shuffledItems.length})</h2>
                <p className="text-slate-500">點擊卡片翻面{autoAudio ? '，會自動發音' : ''}</p>
            </div>

            <div className="relative h-80 w-64 perspective-1000 cursor-pointer" onClick={handleFlip}>
                <motion.div
                    className="relative h-full w-full transition-all duration-500"
                    style={{ transformStyle: 'preserve-3d' }}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                >
                    {/* Front */}
                    <div
                        className="absolute h-full w-full rounded-2xl border-2 border-indigo-100 bg-white p-8 shadow-xl flex flex-col items-center justify-center text-center"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <div className="text-3xl font-bold text-slate-900 mb-4">{currentCard.front}</div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const lang = currentCard.front === currentCard.audio ? 'ko-KR' : 'zh-TW';
                                playAudio(currentCard.front, lang);
                            }}
                            className="p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        >
                            <Volume2 className="h-6 w-6" />
                        </button>
                        <div className="absolute bottom-4 text-sm text-slate-400">正面</div>
                    </div>

                    {/* Back */}
                    <div
                        className="absolute h-full w-full rounded-2xl border-2 border-emerald-100 bg-emerald-50 p-8 shadow-xl flex flex-col items-center justify-center text-center"
                        style={{
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)'
                        }}
                    >
                        <div className="text-3xl font-bold text-emerald-900 mb-4">{currentCard.back}</div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const lang = currentCard.back === currentCard.audio ? 'ko-KR' : 'zh-TW';
                                playAudio(currentCard.back, lang);
                            }}
                            className="p-2 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                        >
                            <Volume2 className="h-6 w-6" />
                        </button>
                        <div className="absolute bottom-4 text-sm text-emerald-600">背面</div>
                    </div>
                </motion.div>
            </div>

            <div className="mt-10 flex gap-6">
                <button
                    onClick={prevCard}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-indigo-300"
                >
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                    onClick={handleFlip}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-indigo-300"
                >
                    <RotateCw className="h-5 w-5" />
                </button>
                <button
                    onClick={nextCard}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                >
                    <ArrowRight className="h-6 w-6" />
                </button>
            </div>
        </div>
    );
};