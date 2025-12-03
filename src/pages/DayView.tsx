import React from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { curriculum } from '../data/curriculum';
import { LessonView } from '../components/lesson/LessonView';

import { ChevronLeft } from 'lucide-react';

export const DayView: React.FC = () => {
    const { folderId, lessonId } = useParams<{ folderId: string; lessonId: string }>();

    const folder = curriculum.folders.find(f => f.id === folderId);
    const lesson = folder?.lessons.find(l => l.id === lessonId);

    if (!folder || !lesson) {
        return <Navigate to="/" replace />;
    }

    return (
        <div>
            <div className="mb-8">
                <Link to={`/folder/${folderId}`} className="mb-4 inline-flex items-center text-sm text-slate-500 hover:text-indigo-600">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    回到 {folder.title}
                </Link>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{lesson.title}</h1>
                <p className="text-lg text-slate-600">{lesson.description}</p>
            </div>

            <LessonView content={lesson.content} />
        </div>
    );
};
