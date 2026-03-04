import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Volume2, Eye, EyeOff, ArrowRight, RotateCcw, Star } from 'lucide-react';

interface ConversationItem {
    id: string;
    korean: string;
    chinese: string;
    audio: string;
    isStarred?: boolean;
}

interface ConversationGameProps {
    items: ConversationItem[];
    title?: string;
    autoPlayPartnerAudio?: boolean;
    onToggleStar?: (id: string, isStarred: boolean) => void;
}

type Role = 'A' | 'B';

const normalizeInput = (value: string) =>
    value
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[\s.,!?;:'"`~’“”。，！？、]/g, '');

export const ConversationGame: React.FC<ConversationGameProps> = ({
    items,
    title = '會話練習',
    autoPlayPartnerAudio = true,
    onToggleStar
}) => {
    const [role, setRole] = useState<Role | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showKorean, setShowKorean] = useState(false);
    const [showChinese, setShowChinese] = useState(false);
    const [input, setInput] = useState('');
    const [result, setResult] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    const [isComplete, setIsComplete] = useState(false);

    const currentItem = items[currentIndex];

    const isUserTurn = useMemo(() => {
        if (!role) return false;
        return role === 'A' ? currentIndex % 2 === 0 : currentIndex % 2 === 1;
    }, [role, currentIndex]);

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
        if (!role || isComplete || !currentItem || isUserTurn || !autoPlayPartnerAudio) return;

        const timer = setTimeout(() => {
            playAudio(currentItem.audio);
        }, 400);

        return () => clearTimeout(timer);
    }, [role, isComplete, currentItem, isUserTurn, autoPlayPartnerAudio]);

    const resetTurnState = () => {
        setShowKorean(false);
        setShowChinese(false);
        setInput('');
        setResult('idle');
    };

    const startPractice = (selectedRole: Role) => {
        setRole(selectedRole);
        setCurrentIndex(0);
        setIsComplete(false);
        resetTurnState();
    };

    const moveNext = () => {
        if (currentIndex >= items.length - 1) {
            setIsComplete(true);
            window.speechSynthesis.cancel();
            return;
        }
        setCurrentIndex(prev => prev + 1);
        resetTurnState();
    };

    const checkAnswer = () => {
        if (!currentItem) return;
        const ok = normalizeInput(input) === normalizeInput(currentItem.korean);
        setResult(ok ? 'correct' : 'incorrect');
    };

    if (!items.length) {
        return <div className="p-8 text-center">沒有可練習的句子</div>;
    }

    if (!role) {
        return (
            <div className="mx-auto max-w-2xl">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                        <MessageSquare className="h-7 w-7" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
                    <p className="text-slate-500 mb-8">先選擇你要扮演先說話的 A，或後說話的 B。</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={() => startPractice('A')}
                            className="rounded-xl bg-indigo-600 px-6 py-4 font-bold text-white hover:bg-indigo-700"
                        >
                            我是 A（先說）
                        </button>
                        <button
                            onClick={() => startPractice('B')}
                            className="rounded-xl bg-emerald-600 px-6 py-4 font-bold text-white hover:bg-emerald-700"
                        >
                            我是 B（後說）
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentItem) {
        return <div className="p-8 text-center">載入中...</div>;
    }

    if (isComplete) {
        return (
            <div className="mx-auto max-w-2xl">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
                    <h2 className="text-2xl font-bold text-emerald-900 mb-2">會話練習完成</h2>
                    <p className="text-emerald-700 mb-6">你已完成本資料夾全部 {items.length} 句對話。</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                        <button
                            onClick={() => startPractice(role)}
                            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700"
                        >
                            <RotateCcw className="h-5 w-5 mr-2" />
                            用同角色重練
                        </button>
                        <button
                            onClick={() => {
                                setRole(null);
                                setIsComplete(false);
                            }}
                            className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 font-bold text-slate-700 border border-slate-300 hover:bg-slate-50"
                        >
                            換角色練習
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl">
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-slate-900">{title} ({currentIndex + 1}/{items.length})</h2>
                <p className="text-slate-500 mt-1">
                    你目前扮演 <span className="font-semibold text-indigo-700">{role}</span>，
                    這句是 <span className={`font-semibold ${isUserTurn ? 'text-emerald-700' : 'text-amber-700'}`}>{isUserTurn ? '你要說' : '對方說'}</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">會話練習固定依原本順序進行</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
                <div className="mb-5 flex items-start justify-between">
                    <div>
                        <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${isUserTurn ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {isUserTurn ? '你的回合（打字）' : '對方回合（聽力）'}
                        </div>
                    </div>
                    {onToggleStar && (
                        <button
                            onClick={() => onToggleStar(currentItem.id, currentItem.isStarred || false)}
                            className={`p-2 rounded-full hover:bg-yellow-50 ${currentItem.isStarred ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
                            title="星號"
                        >
                            <Star className={`h-6 w-6 ${currentItem.isStarred ? 'fill-current' : ''}`} />
                        </button>
                    )}
                </div>

                <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                        onClick={() => setShowChinese(prev => !prev)}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        {showChinese ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {showChinese ? '隱藏中文句子' : '顯示中文句子'}
                    </button>
                    <button
                        onClick={() => setShowKorean(prev => !prev)}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        {showKorean ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {showKorean ? '隱藏韓文句子' : '顯示韓文句子'}
                    </button>
                </div>

                <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">中文</p>
                        <p className={`text-lg ${showChinese ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                            {showChinese ? currentItem.chinese : '（已隱藏）'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">韓文</p>
                        <p className={`text-lg ${showKorean ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                            {showKorean ? currentItem.korean : '（已隱藏）'}
                        </p>
                    </div>
                </div>

                {!isUserTurn ? (
                    <div className="space-y-3">
                        <button
                            onClick={() => playAudio(currentItem.audio)}
                            className="w-full inline-flex items-center justify-center rounded-lg bg-indigo-100 px-5 py-3 font-bold text-indigo-700 hover:bg-indigo-200"
                        >
                            <Volume2 className="h-5 w-5 mr-2" />
                            播放 / 重播對方句子
                        </button>
                        <button
                            onClick={moveNext}
                            className="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700"
                        >
                            我聽完了，下一步
                            <ArrowRight className="h-5 w-5 ml-2" />
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    if (result !== 'idle') setResult('idle');
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                                placeholder="請輸入你要說的韓文句子..."
                                className={`flex-1 rounded-xl border-2 px-4 py-3 text-lg outline-none ${result === 'correct'
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                                    : result === 'incorrect'
                                        ? 'border-rose-300 bg-rose-50'
                                        : 'border-slate-200 focus:border-indigo-500'
                                    }`}
                            />
                            <button
                                onClick={checkAnswer}
                                disabled={!input.trim()}
                                className="rounded-xl bg-slate-900 px-6 font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                            >
                                檢查
                            </button>
                        </div>

                        {result === 'incorrect' && (
                            <p className="mt-3 text-sm font-medium text-rose-600">內容不正確，請再試一次。</p>
                        )}

                        {result === 'correct' && (
                            <div className="mt-4 rounded-lg bg-emerald-50 p-4">
                                <p className="font-bold text-emerald-800">答對了，可以進到下一句。</p>
                                <button
                                    onClick={moveNext}
                                    className="mt-3 inline-flex items-center rounded-lg bg-emerald-600 px-5 py-2.5 font-bold text-white hover:bg-emerald-700"
                                >
                                    下一句
                                    <ArrowRight className="h-5 w-5 ml-2" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
