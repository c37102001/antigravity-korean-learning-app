import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Type, Headphones } from 'lucide-react';

export const ReviewHub: React.FC = () => {
    const games = [
        {
            id: 'flashcards',
            title: '單字卡',
            description: '翻牌記憶，聽發音背單字',
            icon: Layers,
            color: 'bg-amber-100 text-amber-600',
            path: '/review/flashcards'
        },
        {
            id: 'translation',
            title: '翻譯練習',
            description: '中翻韓，可選打字或選擇題',
            icon: Type,
            color: 'bg-emerald-100 text-emerald-600',
            path: '/review/translation'
        },
        {
            id: 'listening',
            title: '聽力練習',
            description: '聽韓文選出正確中文意思',
            icon: Headphones,
            color: 'bg-indigo-100 text-indigo-600',
            path: '/review/listening'
        }
    ];

    return (
        <div className="mx-auto max-w-2xl">
            <div className="mb-12 text-center">
                <h1 className="mb-4 text-3xl font-bold text-slate-900">自學複習</h1>
                <p className="text-lg text-slate-600">
                    透過小遊戲來鞏固記憶，每天練一點！
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-1">
                {games.map((game) => (
                    <Link
                        key={game.id}
                        to={game.path}
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
