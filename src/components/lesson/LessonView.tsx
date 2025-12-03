import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { LessonContent } from '../../types';
import { GrammarCard } from './GrammarCard';
import { ExampleSection } from './ExampleSection';
import { SupplementSection } from './SupplementSection';
import { VideoSection } from '../video/VideoSection';
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

            case 'video_component':
                return content.video_component ? (
                    <div key="video" className="mb-10">
                        <VideoSection
                            data={content.video_component}
                            loopRange={loopRange}
                            isLooping={isLooping}
                            onLoopToggle={() => {
                                setIsLooping(!isLooping);
                                setLoopRange(null);
                            }}
                            onLoopRangeClear={() => setLoopRange(null)}
                            onTranscriptClick={handleTranscriptClick}
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
