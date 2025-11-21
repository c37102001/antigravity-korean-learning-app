import React from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { curriculum } from '../data/curriculum';
import { LessonView } from '../components/lesson/LessonView';
import { ChevronLeft } from 'lucide-react';

export const DayView: React.FC = () => {
    const { weekId, dayId } = useParams<{ weekId: string; dayId: string }>();

    const week = curriculum.weeks.find(w => w.id === weekId);
    const day = week?.days.find(d => d.id === dayId);

    if (!week || !day) {
        return <Navigate to="/" replace />;
    }

    return (
        <div>
            <div className="mb-8">
                <Link to="/" className="mb-4 inline-flex items-center text-sm text-slate-500 hover:text-indigo-600">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    回到首頁
                </Link>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{day.title}</h1>
                <p className="text-lg text-slate-600">{day.description}</p>
            </div>

            <LessonView content={day.content} />
        </div>
    );
};
