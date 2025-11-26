import React, { useRef, useEffect, useState } from 'react';
import YouTube, { type YouTubeProps } from 'react-youtube';

interface VideoPlayerProps {
    videoId: string;
    loopRange: { start: number; end: number } | null;
    isLooping?: boolean;
    onReady?: (event: any) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, loopRange, isLooping = false, onReady }) => {
    const playerRef = useRef<any>(null);
    const loopIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const opts: YouTubeProps['opts'] = {
        height: '390',
        width: '100%',
        playerVars: {
            // https://developers.google.com/youtube/player_parameters
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
        },
    };

    const handleReady = (event: any) => {
        playerRef.current = event.target;
        if (onReady) onReady(event);
    };

    const handleStateChange = (event: any) => {
        // YT.PlayerState.PLAYING = 1
        // YT.PlayerState.ENDED = 0
        setIsPlaying(event.data === 1);

        if (event.data === 0 && isLooping && !loopRange) {
            // Video ended and full loop is enabled (and not in segment loop mode)
            playerRef.current.seekTo(0);
            playerRef.current.playVideo();
        }
    };

    useEffect(() => {
        // Handle looping logic
        if (loopRange && isPlaying && playerRef.current) {
            const checkLoop = () => {
                const currentTime = playerRef.current.getCurrentTime();
                if (currentTime >= loopRange.end) {
                    playerRef.current.seekTo(loopRange.start);
                }
            };

            loopIntervalRef.current = setInterval(checkLoop, 100);
        } else {
            if (loopIntervalRef.current) {
                clearInterval(loopIntervalRef.current);
                loopIntervalRef.current = null;
            }
        }

        return () => {
            if (loopIntervalRef.current) {
                clearInterval(loopIntervalRef.current);
            }
        };
    }, [loopRange, isPlaying]);

    // Effect to seek when loopRange changes (user clicks a transcript line)
    useEffect(() => {
        if (loopRange && playerRef.current) {
            playerRef.current.seekTo(loopRange.start);
            playerRef.current.playVideo();
        }
    }, [loopRange]);

    return (
        <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
            <YouTube
                videoId={videoId}
                opts={opts}
                onReady={handleReady}
                onStateChange={handleStateChange}
                className="w-full h-full"
                iframeClassName="w-full h-full"
            />
        </div>
    );
};
