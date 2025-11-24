import React from 'react';
import type { TranscriptLine } from '../../types';
import { Play } from 'lucide-react';

interface TranscriptListProps {
    transcript: TranscriptLine[];
    onLineClick: (start: number, end: number) => void;
    activeLineIndex?: number;
}

export const TranscriptList: React.FC<TranscriptListProps> = ({ transcript, onLineClick, activeLineIndex }) => {
    const parseTime = (timeStr: string): number => {
        // "00:00:00.000" -> seconds
        const [h, m, s] = timeStr.split(':');
        return parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s);
    };

    return (
        <div className="space-y-4 mt-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">單句重複循環</h3>
            <div className="space-y-3">
                {transcript.map((line, index) => {
                    const startTime = parseTime(line.start);
                    const endTime = parseTime(line.end);
                    const isActive = activeLineIndex === index;

                    return (
                        <div
                            key={index}
                            onClick={() => onLineClick(startTime, endTime)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md group ${isActive
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-100 bg-white hover:border-indigo-200'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`mt-1 p-2 rounded-full ${isActive ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-500'
                                    }`}>
                                    <Play className="w-4 h-4 fill-current" />
                                </div>
                                <div className="flex-1">
                                    <div className={`text-lg font-medium mb-1 ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                                        {line.korean}
                                    </div>
                                    <div className={`text-sm ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                                        {line.chinese}
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400 font-mono mt-1">
                                    {line.start.split('.')[0]}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
