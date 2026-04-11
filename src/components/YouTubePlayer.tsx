import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubePlayerHandle {
  playVideo: () => void;
  pauseVideo: () => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
  getPlayerState: () => number;
  getDuration: () => number;
}

interface YouTubePlayerProps {
  videoId: string;
  onReady?: () => void;
  onStateChange?: (state: number) => void;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  ({ videoId, onReady, onStateChange, onTimeUpdate, onDurationChange }, ref) => {
    const playerElementRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const [isAPIReady, setIsAPIReady] = useState(false);

    // Load YouTube IFrame Player API
    useEffect(() => {
      if (!window.YT) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(script);

        window.onYouTubeIframeAPIReady = () => {
          setIsAPIReady(true);
        };
      } else if (window.YT && window.YT.Player) {
        setIsAPIReady(true);
      }

      return () => {
        // Cleanup on unmount
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch (e) {
            console.log('Error destroying player:', e);
          }
        }
      };
    }, []);

    // Initialize player when API is ready and videoId is available
    useEffect(() => {
      if (isAPIReady && videoId && playerElementRef.current) {
        // Destroy existing player if it exists
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch (e) {
            console.log('Error destroying existing player:', e);
          }
        }

        playerRef.current = new window.YT.Player(playerElementRef.current, {
          videoId: videoId,
          playerVars: {
            enablejsapi: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: (event: any) => {
              console.log('YouTube player ready');
              // Get duration when player is ready
              try {
                const duration = event.target.getDuration();
                if (onDurationChange && duration > 0) {
                  onDurationChange(duration);
                }
              } catch (e) {
                console.log('Error getting duration:', e);
              }
              if (onReady) onReady();
            },
            onStateChange: (event: any) => {
              console.log('Player state changed:', event.data);
              if (onStateChange) onStateChange(event.data);
            },
            onError: (event: any) => {
              console.error('YouTube Player Error:', event.data);
              const errorMessages: { [key: number]: string } = {
                2: 'Invalid video ID',
                5: 'HTML5 player error',
                100: 'Video not found or private',
                101: 'Embedding not allowed by video owner',
                150: 'Embedding not allowed by video owner',
                151: 'Embedding not allowed by video owner',
                153: 'Embedding not allowed by video owner'
              };
              const message = errorMessages[event.data] || `Unknown error: ${event.data}`;
              alert(`YouTube Error ${event.data}: ${message}\n\nTry a different video or check if the video allows embedding.`);
            },
          },
        });

        // Set up time update interval
        const timeUpdateInterval = setInterval(() => {
          if (playerRef.current && playerRef.current.getCurrentTime) {
            try {
              const currentTime = playerRef.current.getCurrentTime();
              if (onTimeUpdate && typeof currentTime === 'number') {
                onTimeUpdate(currentTime);
              }
            } catch (e) {
              console.log('Error getting current time:', e);
            }
          }
        }, 1000);

        return () => {
          clearInterval(timeUpdateInterval);
        };
      }
    }, [isAPIReady, videoId, onReady, onStateChange, onTimeUpdate, onDurationChange]);

    // Expose player methods to parent
    useImperativeHandle(ref, () => ({
      playVideo: () => {
        if (playerRef.current && playerRef.current.playVideo) {
          playerRef.current.playVideo();
        }
      },
      pauseVideo: () => {
        if (playerRef.current && playerRef.current.pauseVideo) {
          playerRef.current.pauseVideo();
        }
      },
      setPlaybackRate: (rate: number) => {
        if (playerRef.current && playerRef.current.setPlaybackRate) {
          playerRef.current.setPlaybackRate(rate);
        }
      },
      getCurrentTime: () => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          return playerRef.current.getCurrentTime();
        }
        return 0;
      },
      seekTo: (seconds: number) => {
        if (playerRef.current && playerRef.current.seekTo) {
          playerRef.current.seekTo(seconds, true);
        }
      },
      getPlayerState: () => {
        if (playerRef.current && playerRef.current.getPlayerState) {
          return playerRef.current.getPlayerState();
        }
        return -1;
      },
      getDuration: () => {
        if (playerRef.current && playerRef.current.getDuration) {
          return playerRef.current.getDuration();
        }
        return 0;
      },
    }));

    return (
      <div className="youtube-player-container">
        <div
          ref={playerElementRef}
          className="youtube-player"
          style={{ width: '100%', height: '100%' }}
        />
        {!isAPIReady && (
          <div className="loading">Loading YouTube Player...</div>
        )}
      </div>
    );
  }
);