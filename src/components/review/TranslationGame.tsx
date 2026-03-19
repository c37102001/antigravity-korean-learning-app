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

interface ShortcutActionButtonProps {
    shortcut: string;
    label: string;
    onClick: () => void;
    variant?: 'soft' | 'outline';
}

interface PartialCheckResult {
    allCorrectPrefix: boolean;
    wrongRawIndices: Set<number>;
    missingSpaceBeforeRawIndices: Set<number>;
}

const ShortcutActionButton: React.FC<ShortcutActionButtonProps> = ({
    shortcut,
    label,
    onClick,
    variant = 'outline'
}) => {
    const baseClassName = variant === 'soft'
        ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${baseClassName}`}
        >
            <span className="inline-flex min-w-6 items-center justify-center rounded-md bg-slate-900 px-1.5 py-0.5 text-xs font-bold text-white">
                {shortcut}
            </span>
            <span>{label}</span>
        </button>
    );
};

const isPunctuation = (char: string) => /\p{P}/u.test(char);

const normalizeText = (text: string): string => {
    return Array.from(text)
        .filter((char) => !isPunctuation(char))
        .join('')
        .toLowerCase();
};

const filteredCharsWithRawMap = (text: string): { chars: string[]; rawMap: number[] } => {
    const chars: string[] = [];
    const rawMap: number[] = [];
    const codepoints = Array.from(text);

    codepoints.forEach((char, rawIdx) => {
        if (isPunctuation(char)) return;
        chars.push(char.toLowerCase());
        rawMap.push(rawIdx);
    });

    return { chars, rawMap };
};

const partialCheckInput = (userInput: string, answer: string): PartialCheckResult => {
    const { chars: userChars, rawMap: userRawMap } = filteredCharsWithRawMap(userInput);
    const { chars: answerChars } = filteredCharsWithRawMap(answer);

    const n = userChars.length;
    const m = answerChars.length;
    if (n === 0) {
        return {
            allCorrectPrefix: true,
            wrongRawIndices: new Set<number>(),
            missingSpaceBeforeRawIndices: new Set<number>()
        };
    }

    const inf = 10 ** 9;
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(inf));
    const parent: Array<Array<[number, number, string] | null>> = Array.from(
        { length: n + 1 },
        () => Array(m + 1).fill(null)
    );
    dp[0][0] = 0;

    const transition = (
        i: number,
        j: number,
        ni: number,
        nj: number,
        cost: number,
        op: string,
        priority: number
    ) => {
        const newCost = dp[i][j] + cost;
        if (newCost < dp[ni][nj]) {
            dp[ni][nj] = newCost;
            parent[ni][nj] = [i, j, op];
            return;
        }
        if (newCost === dp[ni][nj]) {
            const existing = parent[ni][nj];
            const existingPriority = existing ? Number(existing[2].split('|', 1)[0]) : 999;
            if (priority < existingPriority) {
                dp[ni][nj] = newCost;
                parent[ni][nj] = [i, j, op];
            }
        }
    };

    for (let i = 0; i <= n; i += 1) {
        for (let j = 0; j <= m; j += 1) {
            if (dp[i][j] >= inf) continue;

            if (i < n && j < m) {
                const same = userChars[i] === answerChars[j];
                if (same) {
                    transition(i, j, i + 1, j + 1, 0, '0|match', 0);
                } else {
                    const subCost = userChars[i] === ' ' || answerChars[j] === ' ' ? 2 : 1;
                    transition(i, j, i + 1, j + 1, subCost, '3|sub', 3);
                }
            }
            if (i < n) transition(i, j, i + 1, j, 1, '2|del_user', 2);
            if (j < m) transition(i, j, i, j + 1, 1, '1|ins_answer', 1);
        }
    }

    let bestJ = 0;
    let bestCost = dp[n][0];
    for (let j = 1; j <= m; j += 1) {
        if (dp[n][j] < bestCost) {
            bestCost = dp[n][j];
            bestJ = j;
        } else if (dp[n][j] === bestCost && j > bestJ) {
            bestJ = j;
        }
    }

    const wrongRawIndices = new Set<number>();
    const missingSpaceBeforeRawIndices = new Set<number>();

    let i = n;
    let j = bestJ;
    while (i > 0 || j > 0) {
        const step = parent[i][j];
        if (!step) break;
        const [pi, pj, opRaw] = step;
        const op = opRaw.split('|', 2)[1];

        if (op === 'sub' || op === 'del_user') {
            wrongRawIndices.add(userRawMap[i - 1]);
        } else if (op === 'ins_answer') {
            const missingChar = answerChars[j - 1];
            if (pi < n) {
                if (missingChar === ' ') {
                    missingSpaceBeforeRawIndices.add(userRawMap[pi]);
                } else {
                    wrongRawIndices.add(userRawMap[pi]);
                }
            }
        }

        i = pi;
        j = pj;
    }

    return {
        allCorrectPrefix: wrongRawIndices.size === 0 && missingSpaceBeforeRawIndices.size === 0,
        wrongRawIndices,
        missingSpaceBeforeRawIndices
    };
};

export const TranslationGame: React.FC<TranslationGameProps> = ({
    items,
    mode = 'random',
    title = '翻譯練習',
    autoAudio = true,
    onToggleStar
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [input, setInput] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [gameMode, setGameMode] = useState<'typing' | 'choice'>('choice');
    const [shuffledItems, setShuffledItems] = useState<ReviewItem[]>([]);
    const [options, setOptions] = useState<string[]>([]);
    const [showHint, setShowHint] = useState(false);
    const [typingFeedback, setTypingFeedback] = useState<PartialCheckResult | null>(null);
    const [typingMessage, setTypingMessage] = useState('');
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
        setIsCorrect(false);
        setInput('');
        setShowHint(false);
        setTypingFeedback(null);
        setTypingMessage('');
        prevModeRef.current = mode;
    }, [items, mode]);

    const currentItem = shuffledItems[currentIndex];

    useEffect(() => {
        if (currentItem && gameMode === 'choice') {
            const others = items
                .filter(i => i.id !== currentItem.id)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map(i => i.back);

            setOptions([...others, currentItem.back].sort(() => Math.random() - 0.5));
        }
    }, [currentItem, gameMode, items]);

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
        if (!currentItem) return;
        if (!autoAudio) return;
        if (gameMode === 'choice' && showResult) return;
        if (currentItem.front !== currentItem.audio) return;

        const timer = setTimeout(() => {
            playAudio(currentItem.audio);
        }, 500);

        return () => clearTimeout(timer);
    }, [autoAudio, currentItem, gameMode, showResult]);

    useEffect(() => {
        if (gameMode === 'typing') {
            inputRef.current?.focus();
        }
    }, [gameMode, currentIndex]);

    if (!currentItem) return <div>載入中...</div>;

    const resetTypingState = () => {
        setInput('');
        setShowHint(false);
        setTypingFeedback(null);
    };

    const moveToNextQuestion = (message?: string) => {
        setShowResult(false);
        setIsCorrect(false);
        resetTypingState();
        setTypingMessage(message || '');
        setCurrentIndex((prev) => (prev + 1) % shuffledItems.length);
    };

    const moveToPrevQuestion = (message?: string) => {
        setShowResult(false);
        setIsCorrect(false);
        resetTypingState();
        setTypingMessage(message || '');
        setCurrentIndex((prev) => (prev - 1 + shuffledItems.length) % shuffledItems.length);
    };

    const checkChoiceAnswer = (answer: string) => {
        const correct = answer.trim().toLowerCase() === currentItem.back.toLowerCase();
        setIsCorrect(correct);
        setShowResult(true);
        if (correct) {
            playAudio(currentItem.audio);
        }
    };

    const submitTypingAnswer = () => {
        const correct = normalizeText(input) === normalizeText(currentItem.back);
        if (correct) {
            playAudio(currentItem.audio);
            moveToNextQuestion('答對了，已前往下一題。');
        } else {
            setTypingFeedback(null);
            setTypingMessage('答案不正確，可按 2 檢查目前輸入，或按 0 顯示答案。');
        }
    };

    const checkTypingPrefix = () => {
        const result = partialCheckInput(input, currentItem.back);
        setTypingFeedback(result);
        if (!input) {
            setTypingMessage('尚未輸入內容。');
            return;
        }
        if (result.allCorrectPrefix) {
            setTypingMessage('目前輸入到這裡都正確。');
            return;
        }
        setTypingMessage('目前輸入有錯誤（紅底）或少空格（紅色 |）。');
    };

    const toggleTypingHint = () => {
        const next = !showHint;
        setShowHint(next);
        setTypingMessage(next ? '已顯示答案。' : '已隱藏答案。');
    };

    const handleTypingInputChange = (value: string) => {
        setInput(value);
        setTypingFeedback(null);
        setTypingMessage('');
    };

    const handleTypingKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.nativeEvent.isComposing) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            submitTypingAnswer();
            return;
        }
        if (e.key === '1') {
            e.preventDefault();
            moveToPrevQuestion('已移動到上一題。');
            return;
        }
        if (e.key === '3') {
            e.preventDefault();
            moveToNextQuestion('已移動到下一題。');
            return;
        }
        if (e.key === '2') {
            e.preventDefault();
            checkTypingPrefix();
            return;
        }
        if (e.key === '0') {
            e.preventDefault();
            toggleTypingHint();
        }
    };

    const renderTypingFeedback = () => {
        if (!input) {
            return <span className="text-slate-400">（尚未輸入）</span>;
        }

        if (!typingFeedback) {
            return <span>{input}</span>;
        }

        const codepoints = Array.from(input);
        const allGreen = typingFeedback.allCorrectPrefix && codepoints.length > 0;
        const parts: React.ReactNode[] = [];

        codepoints.forEach((char, idx) => {
            if (typingFeedback.missingSpaceBeforeRawIndices.has(idx)) {
                parts.push(
                    <span key={`pipe-${idx}`} className="mx-0.5 rounded bg-red-500 px-0.5 text-white">|</span>
                );
            }

            const isWrong = typingFeedback.wrongRawIndices.has(idx);
            const className = allGreen
                ? 'font-semibold text-emerald-600'
                : isWrong
                    ? 'rounded bg-red-500 px-0.5 text-white'
                    : '';
            const renderedChar = char === ' ' ? '\u00A0' : char;
            parts.push(
                <span key={`char-${idx}`} className={className}>
                    {renderedChar}
                </span>
            );
        });

        return <>{parts}</>;
    };

    const translateTargetLabel = currentItem.back === currentItem.audio ? '韓文' : '中文';
    const typingPlaceholder = translateTargetLabel === '韓文' ? '輸入韓文...' : '輸入中文...';

    return (
        <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900">{title} ({currentIndex + 1}/{shuffledItems.length})</h2>
                <div className="mt-4 flex justify-center gap-4">
                    <button
                        onClick={() => {
                            setGameMode('choice');
                            setShowResult(false);
                            setIsCorrect(false);
                            setTypingFeedback(null);
                            setTypingMessage('');
                        }}
                        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${gameMode === 'choice'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        <MousePointer2 className="h-4 w-4" />
                        選擇題
                    </button>
                    <button
                        onClick={() => {
                            setGameMode('typing');
                            setShowResult(false);
                            setIsCorrect(false);
                        }}
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
                    {onToggleStar && (
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
                    {gameMode === 'choice' && showResult ? (
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
                                onClick={() => moveToNextQuestion()}
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
                                            onClick={() => checkChoiceAnswer(option)}
                                            className="rounded-xl border-2 border-slate-100 p-4 text-lg font-medium text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50"
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-slate-50 p-3">
                                        <div className="flex flex-wrap gap-2">
                                            <ShortcutActionButton
                                                shortcut="1"
                                                label="上一題"
                                                onClick={() => moveToPrevQuestion('已移動到上一題。')}
                                                variant="soft"
                                            />
                                            <ShortcutActionButton
                                                shortcut="2"
                                                label="檢查目前輸入"
                                                onClick={checkTypingPrefix}
                                                variant="soft"
                                            />
                                            <ShortcutActionButton
                                                shortcut="3"
                                                label="下一題"
                                                onClick={() => moveToNextQuestion('已移動到下一題。')}
                                                variant="soft"
                                            />
                                            <ShortcutActionButton
                                                shortcut="0"
                                                label="顯示/隱藏答案"
                                                onClick={toggleTypingHint}
                                                variant="soft"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={input}
                                            onChange={(e) => handleTypingInputChange(e.target.value)}
                                            onKeyDown={handleTypingKeyDown}
                                            placeholder={typingPlaceholder}
                                            className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 text-lg outline-none focus:border-indigo-500"
                                            autoFocus
                                        />
                                        <button
                                            onClick={submitTypingAnswer}
                                            className="rounded-xl bg-indigo-600 px-6 font-bold text-white hover:bg-indigo-700"
                                        >
                                            送出
                                        </button>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <p className="font-medium text-slate-700">
                                                提示：{showHint ? currentItem.back : 'hidden'}
                                            </p>
                                            <ShortcutActionButton
                                                shortcut="0"
                                                label={showHint ? '隱藏答案' : '顯示答案'}
                                                onClick={toggleTypingHint}
                                            />
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                        <p className="mb-1 text-sm text-slate-500">目前輸入檢查</p>
                                        <div className="whitespace-pre-wrap break-all font-mono text-base text-slate-900">
                                            {renderTypingFeedback()}
                                        </div>
                                    </div>

                                    {typingMessage && (
                                        <div className="rounded-lg bg-indigo-50 p-3 text-sm font-medium text-indigo-700">
                                            {typingMessage}
                                        </div>
                                    )}

                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
