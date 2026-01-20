import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Home } from 'lucide-react';

export const Header: React.FC = () => {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link to="/" className="flex items-center gap-2 text-lg font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                    <BookOpen className="h-6 w-6" />
                    <span>韓文速通</span>
                </Link>

                <nav className="flex items-center gap-4">
                    <Link to="/" className="p-2 text-slate-600 hover:text-indigo-600 transition-colors">
                        <Home className="h-5 w-5" />
                    </Link>
                </nav>
            </div>
        </header>
    );
};
