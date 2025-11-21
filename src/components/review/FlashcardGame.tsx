import React, { useState } from 'react';
import { vocabulary } from '../../data/vocabulary';
import { motion } from 'framer-motion';
import { Volume2, RotateCw, ArrowRight, ArrowLeft } from 'lucide-react';

export const FlashcardGame: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const currentCard = vocabulary[currentIndex];

    const playAudio = (text: string, lang: 'ko-KR' | 'zh-TW') => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        window.speechSynthesis.speak(utterance);
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
        if (!isFlipped) {
            // Flipping to Chinese side
            playAudio(currentCard.chinese, 'zh-TW');
        } else {
            // Flipping back to Korean side
            playAudio(currentCard.korean, 'ko-KR');
        }
    };

    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % vocabulary.length);
        }, 200);
    };

    const prevCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + vocabulary.length) % vocabulary.length);
        }, 200);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900">單字卡 ({currentIndex + 1}/{vocabulary.length})</h2>
                <p className="text-slate-500">點擊卡片翻面，會自動發音</p>
            </div>

            <div className="relative h-80 w-64 perspective-1000 cursor-pointer" onClick={handleFlip}>
                <motion.div
                    className="relative h-full w-full transition-all duration-500 preserve-3d"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                >
                    {/* Front (Korean) */}
                    <div className="absolute h-full w-full backface-hidden rounded-2xl border-2 border-indigo-100 bg-white p-8 shadow-xl flex flex-col items-center justify-center">
                        <div className="text-4xl font-bold text-slate-900 mb-4">{currentCard.korean}</div>
                        <button
                            onClick={(e) => { e.stopPropagation(); playAudio(currentCard.korean, 'ko-KR'); }}
                            className="p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        >
                            <Volume2 className="h-6 w-6" />
                        </button>
                        <div className="absolute bottom-4 text-sm text-slate-400">韓文</div>
                    </div>

                    {/* Back (Chinese) */}
                    <div className="absolute h-full w-full backface-hidden rounded-2xl border-2 border-emerald-100 bg-emerald-50 p-8 shadow-xl flex flex-col items-center justify-center rotate-y-180">
                        <div className="text-3xl font-bold text-emerald-900 mb-4">{currentCard.chinese}</div>
                        <button
                            onClick={(e) => { e.stopPropagation(); playAudio(currentCard.chinese, 'zh-TW'); }}
                            className="p-2 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                        >
                            <Volume2 className="h-6 w-6" />
                        </button>
                        <div className="absolute bottom-4 text-sm text-emerald-600">中文</div>
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
