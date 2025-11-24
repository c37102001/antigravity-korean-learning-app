import React, { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { curriculum } from '../data/curriculum';
import { LessonView } from '../components/lesson/LessonView';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { TranscriptList } from '../components/video/TranscriptList';
import { ChevronLeft } from 'lucide-react';

export const DayView: React.FC = () => {
    const { folderId, lessonId } = useParams<{ folderId: string; lessonId: string }>();
    const [loopRange, setLoopRange] = useState<{ start: number; end: number } | null>(null);

    const folder = curriculum.folders.find(f => f.id === folderId);
    const lesson = folder?.lessons.find(l => l.id === lessonId);

    if (!folder || !lesson) {
        return <Navigate to="/" replace />;
    }

    const isVideoLesson = !!lesson.content.video_link;

    const handleTranscriptClick = (start: number, end: number) => {
        setLoopRange({ start, end });
    };

    // Extract video ID from URL
    const getVideoId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

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

            {isVideoLesson && lesson.content.video_link && lesson.content.transcript ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="sticky top-6">
                            <VideoPlayer
                                videoId={getVideoId(lesson.content.video_link) || ''}
                                loopRange={loopRange}
                            />
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <TranscriptList
                            transcript={lesson.content.transcript}
                            onLineClick={handleTranscriptClick}
                            activeLineIndex={-1} // Optional: could track active line based on time
                        />
                    </div>
                </div>
            ) : (
                <LessonView content={lesson.content} />
            )}
        </div>
    );
};
