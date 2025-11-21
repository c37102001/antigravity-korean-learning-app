import React from 'react';
import { MessageCircle } from 'lucide-react';

interface SupplementSectionProps {
    content: string;
}

export const SupplementSection: React.FC<SupplementSectionProps> = ({ content }) => {
    return (
        <div className="mb-8 rounded-2xl bg-amber-50 p-6 text-amber-900 border border-amber-100">
            <div className="mb-2 flex items-center gap-2 font-bold text-amber-700">
                <MessageCircle className="h-5 w-5" />
                <span>補充</span>
            </div>
            <p className="whitespace-pre-line leading-relaxed">{content}</p>
        </div>
    );
};
