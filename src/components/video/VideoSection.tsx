import React, { useState, useRef, useEffect } from 'react';
import type { VideoComponentData } from '../../types';
import { VideoPlayer } from './VideoPlayer';
import { TranscriptList } from './TranscriptList';

interface VideoSectionProps {
    data: VideoComponentData;
}

export const VideoSection: React.FC<VideoSectionProps> = ({
    data
}) => {
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined);
    const [loopRange, setLoopRange] = useState<{ start: number; end: number } | null>(null);
    const [isLooping, setIsLooping] = useState(false);

    // Extract video ID from URL
    const getVideoId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Effect to measure video height for desktop layout
    useEffect(() => {
        const updateHeight = () => {
            if (videoContainerRef.current) {
                // In desktop view (side-by-side), we want to constrain the transcript height to the video height
                // The video player maintains aspect ratio, so its height changes with width.
                // We can use ResizeObserver or just measure on window resize.
                setContainerHeight(videoContainerRef.current.offsetHeight);
            }
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    const handleTranscriptClick = (start: number, end: number) => {
        setLoopRange({ start, end });
        setIsLooping(false); // Disable full loop if segment loop is active
    };

    const handleLoopToggle = () => {
        setIsLooping(!isLooping);
        setLoopRange(null);
    };

    const handleLoopRangeClear = () => {
        setLoopRange(null);
    };

    const videoId = getVideoId(data.link);

    if (!videoId) return null;

    return (
        <div className="flex flex-col gap-6">
            {/* Video Column */}
            <div ref={videoContainerRef} className="flex flex-col">
                <VideoPlayer
                    videoId={videoId}
                    loopRange={loopRange}
                    isLooping={isLooping}
                />
                <div className="mt-4 flex items-center justify-between">
                    <button
                        onClick={handleLoopToggle}
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
                            onClick={handleLoopRangeClear}
                            className="text-sm text-slate-500 hover:text-slate-700"
                        >
                            取消單句循環
                        </button>
                    )}
                </div>
            </div>

            {/* Transcript Column */}
            {data.transcript && (
                <div
                    className="overflow-y-auto custom-scrollbar"
                    style={{
                        // Constrain transcript height to video container height to prevent infinite scrolling
                        maxHeight: containerHeight ? `${containerHeight}px` : '500px'
                    }}
                >
                    <TranscriptList
                        transcript={data.transcript}
                        onLineClick={handleTranscriptClick}
                        activeLineIndex={-1}
                    />
                </div>
            )}
        </div>
    );
};
