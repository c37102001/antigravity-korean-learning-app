import React, { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { curriculum } from '../data/curriculum';
import { LessonView } from '../components/lesson/LessonView';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { TranscriptList } from '../components/video/TranscriptList';
import { ChevronLeft, Trophy } from 'lucide-react';

export const DayView: React.FC = () => {
    const { folderId, lessonId } = useParams<{ folderId: string; lessonId: string }>();
    const [loopRange, setLoopRange] = useState<{ start: number; end: number } | null>(null);
    const [isLooping, setIsLooping] = useState(false);

    const folder = curriculum.folders.find(f => f.id === folderId);
    const lesson = folder?.lessons.find(l => l.id === lessonId);

    if (!folder || !lesson) {
        return <Navigate to="/" replace />;
    }

    const isVideoLesson = !!lesson.content.video_link;

    const handleTranscriptClick = (start: number, end: number) => {
        setLoopRange({ start, end });
        setIsLooping(false); // Disable full loop if segment loop is active
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
                                isLooping={isLooping}
                            />
                            <div className="mt-4 flex items-center justify-between">
                                <button
                                    onClick={() => {
                                        setIsLooping(!isLooping);
                                        setLoopRange(null); // Clear segment loop if full loop is toggled
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isLooping
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                        <path d="M3 3v5h5" />
                                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                        <path d="M16 21h5v-5" />
                                    </svg>
                                    {isLooping ? '循環播放中' : '循環播放影片'}
                                </button>
                                {loopRange && (
                                    <button
                                        onClick={() => setLoopRange(null)}
                                        className="text-sm text-slate-500 hover:text-slate-700"
                                    >
                                        取消單句循環
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <TranscriptList
                            transcript={lesson.content.transcript}
                            onLineClick={handleTranscriptClick}
                            activeLineIndex={-1} // Optional: could track active line based on time
                        />

                        {/* Unit Review Button for Video Lessons */}
                        <div className="mt-12 mb-8 text-center">
                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-slate-50 px-4 text-sm text-slate-500">完成學習了嗎？</span>
                                </div>
                            </div>
                            <Link
                                to={`/folder/${folderId}/lesson/${lessonId}/review`}
                                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:scale-105 hover:shadow-xl"
                            >
                                <Trophy className="h-6 w-6" />
                                開始單元複習
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <LessonView content={lesson.content} />
            )}
        </div>
    );
};
