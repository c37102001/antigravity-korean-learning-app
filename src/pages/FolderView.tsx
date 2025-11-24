import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { curriculum } from '../data/curriculum';
import { ChevronRight, ChevronLeft, BookOpen } from 'lucide-react';

export const FolderView: React.FC = () => {
    const { folderId } = useParams<{ folderId: string }>();
    const folder = curriculum.folders.find(f => f.id === folderId);

    if (!folder) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="mx-auto max-w-3xl">
            <div className="mb-8">
                <Link to="/" className="mb-4 inline-flex items-center text-sm text-slate-500 hover:text-indigo-600">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    回到首頁
                </Link>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">{folder.title}</h1>
                </div>
                <p className="text-lg text-slate-600 ml-12">{folder.description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-1">
                {folder.lessons.map((lesson) => (
                    <Link
                        key={lesson.id}
                        to={`/folder/${folder.id}/lesson/${lesson.id}`}
                        className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-300 hover:shadow-md hover:translate-x-1"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                {lesson.id.includes('-')
                                    ? lesson.id.split('-')[1].toUpperCase()
                                    : (lesson.id.charAt(0) + lesson.id.replace(/\D/g, '')).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                                    {lesson.title}
                                </h3>
                                <p className="text-sm text-slate-500 line-clamp-1">
                                    {lesson.description}
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500" />
                    </Link>
                ))}
            </div>
        </div>
    );
};
