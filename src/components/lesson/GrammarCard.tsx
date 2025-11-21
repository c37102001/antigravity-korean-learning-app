import React from 'react';
import type { GrammarPoint } from '../../types';
import { motion } from 'framer-motion';

interface GrammarCardProps {
    grammar: GrammarPoint;
    index: number;
}

export const GrammarCard: React.FC<GrammarCardProps> = ({ grammar, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
            <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
                <h3 className="text-xl font-bold text-indigo-900">{grammar.title}</h3>
            </div>
            <div className="p-6">
                <p className="mb-4 whitespace-pre-line text-slate-700 leading-relaxed">{grammar.explanation}</p>

                <div className="space-y-3">
                    {grammar.examples.map((ex, i) => (
                        <div key={i} className="rounded-lg bg-slate-50 p-3 text-sm">
                            <div className="font-medium text-slate-900">{ex.korean}</div>
                            <div className="text-slate-500">{ex.chinese}</div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
