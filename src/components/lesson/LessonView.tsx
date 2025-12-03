import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { LessonContent } from '../../types';
import { GrammarCard } from './GrammarCard';
import { ExampleSection } from './ExampleSection';
import { SupplementSection } from './SupplementSection';
import { VideoPlayer } from '../video/VideoPlayer';
import { TranscriptList } from '../video/TranscriptList';
import { Trophy } from 'lucide-react';

interface LessonViewProps {
    content: LessonContent;
}

export const LessonView: React.FC<LessonViewProps> = ({ content }) => {
    const { folderId, lessonId } = useParams<{ folderId: string; lessonId: string }>();
    const [loopRange, setLoopRange] = useState<{ start: number; end: number } | null>(null);
    const [isLooping, setIsLooping] = useState(false);

    const hasReviewableContent = (content.examples && content.examples.length > 0) ||
        (content.grammar && content.grammar.some(g => g.examples && g.examples.length > 0));

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

    const renderComponent = (key: string) => {
        switch (key) {
            case 'grammar':
                return content.grammar && content.grammar.length > 0 ? (
                    <div key="grammar" className="mb-10">
                        <h2 className="mb-6 text-2xl font-bold text-slate-900">文法解釋</h2>
                        {content.grammar.map((g, i) => (
                            <GrammarCard key={i} grammar={g} index={i} />
                        ))}
                    </div>
                ) : null;

            case 'examples':
                return content.examples && content.examples.length > 0 ? (
                    <div key="examples" className="mb-10">
                        <ExampleSection examples={content.examples} />
                    </div>
                ) : null;

            case 'supplementary':
                return content.supplementary ? (
                    <div key="supplementary" className="mb-10">
                        <SupplementSection content={content.supplementary} />
                    </div>
                ) : null;

            case 'video_link':
                return content.video_link ? (
                    <div key="video" className="mb-10">
                        <VideoPlayer
                            videoId={getVideoId(content.video_link) || ''}
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
                ) : null;

            case 'transcript':
                return content.transcript ? (
                    <div key="transcript" className="mb-10">
                        <TranscriptList
                            transcript={content.transcript}
                            onLineClick={handleTranscriptClick}
                            activeLineIndex={-1}
                        />
                    </div>
                ) : null;

            default:
                return null;
        }
    };

    return (
        <div className="mx-auto max-w-2xl">
            {Object.keys(content).map(key => renderComponent(key))}

            {/* Unit Review Button */}
            {hasReviewableContent && (
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
            )}
        </div>
    );
};
