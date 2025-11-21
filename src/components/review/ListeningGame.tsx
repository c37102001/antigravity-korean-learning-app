import React, { useState, useEffect } from 'react';
import { vocabulary } from '../../data/vocabulary';
import { Volume2 } from 'lucide-react';

export const ListeningGame: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [options, setOptions] = useState<string[]>([]);
    const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    const [score, setScore] = useState(0);

    const currentWord = vocabulary[currentIndex];

    useEffect(() => {
        generateOptions();
    }, [currentIndex]);

    const generateOptions = () => {
        const otherWords = vocabulary.filter(v => v.id !== currentWord.id);
        const distractors = otherWords.sort(() => Math.random() - 0.5).slice(0, 3);
        const newOptions = [currentWord.chinese, ...distractors.map(d => d.chinese)].sort(() => Math.random() - 0.5);
        setOptions(newOptions);
    };

    // --- 修改開始：優先指定 Yuna 的發音函式 ---
    const playAudio = () => {
        window.speechSynthesis.cancel(); // 停止之前的發音

        const utterance = new SpeechSynthesisUtterance(currentWord.korean);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.8; // 韓文語速微調

        let voices = window.speechSynthesis.getVoices();

        // 處理 iOS 語音延遲載入
        if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                voices = window.speechSynthesis.getVoices();
            };
        }

        // 優先尋找 "Yuna"，找不到才找其他韓文語音
        const targetVoice = voices.find(v => v.name.includes('Yuna'))
            || voices.find(v => v.lang.includes('ko') || v.lang.includes('KR'));

        if (targetVoice) {
            utterance.voice = targetVoice;
        }

        window.speechSynthesis.speak(utterance);
    };
    // --- 修改結束 ---

    const checkAnswer = (answer: string) => {
        if (status !== 'idle') return;

        if (answer === currentWord.chinese) {
            setStatus('correct');
            setScore(s => s + 1);
            setTimeout(nextQuestion, 1000);
        } else {
            setStatus('incorrect');
        }
    };

    const nextQuestion = () => {
        setStatus('idle');
        setCurrentIndex(prev => (prev + 1) % vocabulary.length);
    };

    return (
        <div className="mx-auto max-w-lg">
            <div className="mb-8 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">聽力練習</h2>
                <div className="font-bold text-slate-900">得分: {score}</div>
            </div>

            <div className="mb-12 flex flex-col items-center justify-center">
                <button
                    onClick={playAudio}
                    className="flex h-32 w-32 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition-all hover:bg-indigo-200 hover:scale-105 active:scale-95"
                >
                    <Volume2 className="h-16 w-16" />
                </button>
                <p className="mt-4 text-slate-500">點擊播放音檔</p>
            </div>

            <div className="grid gap-4">
                {options.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => checkAnswer(opt)}
                        disabled={status !== 'idle'}
                        className={`p-6 rounded-xl border-2 text-lg font-bold transition-all ${status === 'correct' && opt === currentWord.chinese ? 'border-emerald-500 bg-emerald-50 text-emerald-700' :
                            status === 'incorrect' && opt !== currentWord.chinese ? 'opacity-50' :
                                status === 'incorrect' && opt === currentWord.chinese ? 'border-emerald-500 bg-emerald-50 text-emerald-700' :
                                    'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                            }`}
                    >
                        {opt}
                    </button>
                ))}
            </div>

            {status === 'incorrect' && (
                <div className="mt-6 text-center animate-bounce">
                    <div className="text-rose-600 font-bold mb-2">答錯了！正確答案是：</div>
                    <div className="text-2xl font-bold text-slate-900">{currentWord.chinese}</div>
                    <button onClick={nextQuestion} className="mt-4 text-indigo-600 font-medium hover:underline">
                        下一題
                    </button>
                </div>
            )}
        </div>
    );
};