import React from 'react';
import { motion } from 'framer-motion';
import type { GrammarPoint } from '../../types';
import { Volume2 } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';

interface GrammarCardProps {
    grammar: GrammarPoint;
    index: number;
}

export const GrammarCard: React.FC<GrammarCardProps> = ({ grammar, index }) => {
    const { playAudio } = useAudio();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="mb-6 rounded-2xl bg-white p-6 shadow-sm border border-slate-100"
        >
            <div className="mb-4 border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-indigo-900">{grammar.title}</h3>
            </div>
            <div>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                    {Array.isArray(grammar.explanation) ? (
                        grammar.explanation.map((line, index) => (
                            <p key={index}>{line}</p>
                        ))
                    ) : (
                        <p>{grammar.explanation}</p>
                    )}
                </div>

                {grammar.examples && grammar.examples.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">例句</h4>
                        <div className="space-y-3">
                            {grammar.examples.map((example, index) => (
                                <div
                                    key={index}
                                    onClick={() => playAudio(example.korean)}
                                    className="group bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-emerald-50 transition-colors active:scale-[0.99] flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900 mb-1">{example.korean}</p>
                                        <p className="text-sm text-gray-600">{example.chinese}</p>
                                    </div>
                                    <div className="text-slate-400 group-hover:text-emerald-600 transition-colors">
                                        <Volume2 className="h-4 w-4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
