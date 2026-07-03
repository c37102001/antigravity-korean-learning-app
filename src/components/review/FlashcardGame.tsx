import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Volume2, RotateCw, ArrowRight, ArrowLeft, Play, Pause, Star } from 'lucide-react';
import type { ReviewItem } from '../../types';

interface FlashcardGameProps {
    items: ReviewItem[];
    mode?: 'sequential' | 'random';
    title?: string;
    autoAudio?: boolean;
    flipDelay?: number;
    onToggleStar?: (id: string, isStarred: boolean) => void;
}

export const FlashcardGame: React.FC<FlashcardGameProps> = ({
    items,
    mode = 'random',
    title = '單字卡',
    autoAudio = true,
    flipDelay = 0,
    onToggleStar
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [shuffledItems, setShuffledItems] = useState<ReviewItem[]>([]);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [noFlipMode, setNoFlipMode] = useState(false);
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
        setIsFlipped(false);
        setIsAutoPlaying(false);
        prevModeRef.current = mode;
    }, [items, mode]);

    const playAudio = useCallback((text: string, lang: 'ko-KR' | 'zh-TW', onEnd?: () => void) => {
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

        if (onEnd) {
            utterance.onend = onEnd;
            utterance.onerror = onEnd; // Handle error as completion to avoid getting stuck
        }

        window.speechSynthesis.speak(utterance);
    }, []);

    // Standard auto-audio effect (only when NOT auto-playing)
    useEffect(() => {
        if (autoAudio && shuffledItems.length > 0 && !isAutoPlaying) {
            const current = shuffledItems[currentIndex];
            // When card changes, we are always at Front side initially
            const lang = current.front === current.audio ? 'ko-KR' : 'zh-TW';

            // Small delay to ensure smooth transition
            const timer = setTimeout(() => {
                playAudio(current.front, lang);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [currentIndex, autoAudio, shuffledItems, isAutoPlaying, playAudio]);

    // Auto-play logic
    useEffect(() => {
        if (!isAutoPlaying || shuffledItems.length === 0) {
            if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
            return;
        }

        const currentCard = shuffledItems[currentIndex];
        // Standard delay for Back -> Next transition
        const defaultDelay = 1000;
        // Apply extra delay only for Front -> Back transition
        const currentDelay = isFlipped ? defaultDelay : (defaultDelay + (flipDelay * 1000));

        const proceed = () => {
            autoPlayTimerRef.current = setTimeout(() => {
                if (noFlipMode) {
                    setIsFlipped(false);
                    setCurrentIndex((prev) => (prev + 1) % shuffledItems.length);
                } else {
                    // Standard Mode
                    if (!isFlipped) {
                        setIsFlipped(true);
                    } else {
                        setIsFlipped(false);
                        setCurrentIndex((prev) => (prev + 1) % shuffledItems.length);
                    }
                }
            }, currentDelay);
        };

        if (autoAudio) {
            const text = isFlipped ? currentCard.back : currentCard.front;
            const lang = (isFlipped ? currentCard.back : currentCard.front) === currentCard.audio ? 'ko-KR' : 'zh-TW';

            // Add a small initial delay before speaking so the user sees the card first
            autoPlayTimerRef.current = setTimeout(() => {
                playAudio(text, lang, proceed);
            }, 500);
        } else {
            // If no audio, just wait a fixed time then proceed
            autoPlayTimerRef.current = setTimeout(proceed, 2000 + (isFlipped ? 0 : flipDelay * 1000));
        }

        return () => {
            if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
            window.speechSynthesis.cancel();
        };
    }, [isAutoPlaying, currentIndex, isFlipped, shuffledItems, autoAudio, playAudio, flipDelay, noFlipMode]);


    if (shuffledItems.length === 0) {
        return <div className="text-center py-10">載入中...</div>;
    }

    const currentCard = shuffledItems[currentIndex];

    const handleFlip = () => {
        if (isAutoPlaying) setIsAutoPlaying(false);

        const newFlippedState = !isFlipped;
        setIsFlipped(newFlippedState);

        if (autoAudio) {
            if (newFlippedState) {
                const lang = currentCard.back === currentCard.audio ? 'ko-KR' : 'zh-TW';
                playAudio(currentCard.back, lang);
            } else {
                const lang = currentCard.front === currentCard.audio ? 'ko-KR' : 'zh-TW';
                playAudio(currentCard.front, lang);
            }
        }
    };

    const nextCard = () => {
        if (isAutoPlaying) setIsAutoPlaying(false);
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev + 1) % shuffledItems.length);
    };

    const prevCard = () => {
        if (isAutoPlaying) setIsAutoPlaying(false);
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev - 1 + shuffledItems.length) % shuffledItems.length);
    };

    const toggleAutoPlay = () => {
        setIsAutoPlaying(!isAutoPlaying);
    };

    const toggleNoFlipMode = () => {
        setNoFlipMode(!noFlipMode);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="mb-8 text-center bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white/20 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900">{title} ({currentIndex + 1}/{shuffledItems.length})</h2>
                <p className="text-slate-500 mb-2">
                    {isAutoPlaying ? '自動播放中...' : `點擊卡片翻面${autoAudio ? '，會自動發音' : ''}`}
                </p>
                <button
                    onClick={toggleNoFlipMode}
                    disabled={isAutoPlaying}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${noFlipMode
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                        } ${isAutoPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${noFlipMode ? 'bg-indigo-500' : 'bg-gray-400'}`}></span>
                    播放時不翻面
                </button>
            </div>

            <div className="relative h-80 w-64 perspective-1000 cursor-pointer" onClick={handleFlip}>
                <motion.div
                    key={currentCard.id}
                    className="relative h-full w-full transition-all duration-500"
                    style={{ transformStyle: 'preserve-3d' }}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                >
                    {/* Front */}
                    <div
                        className="absolute h-full w-full rounded-2xl border-2 border-indigo-100 bg-white p-8 shadow-xl flex flex-col items-center justify-center text-center"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        {onToggleStar && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleStar(currentCard.id, currentCard.isStarred || false);
                                }}
                                className={`absolute top-4 right-4 p-2 rounded-full hover:bg-yellow-50 ${currentCard.isStarred ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
                            >
                                <Star className={`h-6 w-6 ${currentCard.isStarred ? 'fill-current' : ''}`} />
                            </button>
                        )}
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
                        {onToggleStar && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleStar(currentCard.id, currentCard.isStarred || false);
                                }}
                                className={`absolute top-4 right-4 p-2 rounded-full hover:bg-yellow-50 ${currentCard.isStarred ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
                            >
                                <Star className={`h-6 w-6 ${currentCard.isStarred ? 'fill-current' : ''}`} />
                            </button>
                        )}
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

            <div className="mt-10 flex gap-6 items-center">
                <button
                    onClick={prevCard}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-indigo-300"
                    title="上一張"
                >
                    <ArrowLeft className="h-6 w-6" />
                </button>

                <button
                    onClick={toggleAutoPlay}
                    className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all ${isAutoPlaying
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-indigo-300'
                        }`}
                    title={isAutoPlaying ? "暫停" : "自動播放"}
                >
                    {isAutoPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                </button>

                <button
                    onClick={handleFlip}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-indigo-300"
                    title="翻面"
                >
                    <RotateCw className="h-5 w-5" />
                </button>

                <button
                    onClick={nextCard}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                    title="下一張"
                >
                    <ArrowRight className="h-6 w-6" />
                </button>
            </div>
        </div>
    );
};
