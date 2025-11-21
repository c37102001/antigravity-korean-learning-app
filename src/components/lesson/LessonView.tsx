import React from 'react';
import type { LessonContent } from '../../types';
import { GrammarCard } from './GrammarCard';
import { ExampleSection } from './ExampleSection';
import { SupplementSection } from './SupplementSection';
import { PracticeInput } from './PracticeInput';

interface LessonViewProps {
    content: LessonContent;
}

export const LessonView: React.FC<LessonViewProps> = ({ content }) => {
    return (
        <div className="mx-auto max-w-2xl">
            {/* Grammar Section */}
            {content.grammar.length > 0 && (
                <div className="mb-10">
                    <h2 className="mb-6 text-2xl font-bold text-slate-900">文法解釋</h2>
                    {content.grammar.map((g, i) => (
                        <GrammarCard key={i} grammar={g} index={i} />
                    ))}
                </div>
            )}

            {/* Examples Section */}
            {content.examples.length > 0 && (
                <div className="mb-10">
                    <ExampleSection examples={content.examples} />
                </div>
            )}

            {/* Supplementary Section */}
            {content.supplementary && (
                <div className="mb-10">
                    <SupplementSection content={content.supplementary} />
                </div>
            )}

            {/* Practice Section */}
            {content.exercises.length > 0 && (
                <div className="mb-10">
                    <h2 className="mb-6 text-2xl font-bold text-slate-900">練習題</h2>
                    <PracticeInput exercises={content.exercises} />
                </div>
            )}
        </div>
    );
};
