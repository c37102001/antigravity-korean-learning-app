import React, { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { curriculum } from '../data/curriculum';
import { Layers, Type, Headphones, ChevronLeft, Shuffle, ListOrdered } from 'lucide-react';

export const LessonReviewHub: React.FC = () => {
    const { folderId, lessonId } = useParams<{ folderId: string; lessonId: string }>();
    const [mode, setMode] = useState<'random' | 'sequential'>('random');
    const [frontSide, setFrontSide] = useState<'question' | 'answer'>('question');
    const [autoAudio, setAutoAudio] = useState(true);

    const folder = curriculum.folders.find(f => f.id === folderId);
    const lesson = folder?.lessons.find(l => l.id === lessonId);

    if (!folder || !lesson) {
        return <Navigate to="/" replace />;
    }

    const games = [
        {
            id: 'flashcards',
            title: '單字卡',
            description: '翻牌記憶，聽發音背誦',
            icon: Layers,
            color: 'bg-amber-100 text-amber-600',
        },
        {
            id: 'translation',
            title: '翻譯練習',
            description: '看題目，翻譯成韓文',
            icon: Type,
            color: 'bg-emerald-100 text-emerald-600',
        },
        {
            id: 'listening',
            title: '聽力練習',
            description: '聽韓文，選出正確意思',
            icon: Headphones,
            color: 'bg-indigo-100 text-indigo-600',
        }
    ];

    return (
        <div className="mx-auto max-w-2xl">
            <div className="mb-8">
                <Link to={`/folder/${folderId}/lesson/${lessonId}`} className="mb-4 inline-flex items-center text-sm text-slate-500 hover:text-indigo-600">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    回到課程
                </Link>
                <h1 className="mb-2 text-3xl font-bold text-slate-900">單元複習：{lesson.title}</h1>
                <p className="text-lg text-slate-600">
                    使用本課的練習題進行強化訓練
                </p>
            </div>

            <div className="mb-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-slate-900">複習設定</h3>

                <div className="flex flex-wrap gap-6">
                    {/* Order Setting */}
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-slate-500">出題順序</span>
                        <div className="flex rounded-lg bg-slate-100 p-1">
                            <button
                                onClick={() => setMode('random')}
                                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${mode === 'random' ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Shuffle className="h-4 w-4" />
                                隨機
                            </button>
                            <button
                                onClick={() => setMode('sequential')}
                                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${mode === 'sequential' ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <ListOrdered className="h-4 w-4" />
                                順序
                            </button>
                        </div>
                    </div>

                    {/* Front Side Setting */}
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-slate-500">優先顯示 (單字卡)</span>
                        <div className="flex rounded-lg bg-slate-100 p-1">
                            <button
                                onClick={() => setFrontSide('question')}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${frontSide === 'question' ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                中文/題目
                            </button>
                            <button
                                onClick={() => setFrontSide('answer')}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${frontSide === 'answer' ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                韓文/答案
                            </button>
                        </div>
                    </div>

                    {/* Audio Setting */}
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-slate-500">語音設定</span>
                        <div className="flex rounded-lg bg-slate-100 p-1">
                            <button
                                onClick={() => setAutoAudio(true)}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${autoAudio ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                自動播放
                            </button>
                            <button
                                onClick={() => setAutoAudio(false)}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${!autoAudio ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                手動播放
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-1">
                {games.map((game) => (
                    <Link
                        key={game.id}
                        to={`/folder/${folderId}/lesson/${lessonId}/review/${game.id}?mode=${mode}&front=${frontSide}&audio=${autoAudio}`}
                        className="group flex items-center gap-6 rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1"
                    >
                        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${game.color} transition-transform group-hover:scale-110`}>
                            <game.icon className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">{game.title}</h3>
                            <p className="text-slate-500">{game.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};
