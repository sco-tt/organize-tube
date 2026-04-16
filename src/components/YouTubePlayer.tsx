import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

export interface YouTubePlayerHandle {
  playVideo: () => void;
  pauseVideo: () => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
  getPlayerState: () => number;
  getDuration: () => number;
  setVolume: (volume: number) => void;
  getVolume: () => number;
}

interface YouTubePlayerProps {
  videoId: string;
  onReady?: () => void;
  onStateChange?: (state: number) => void;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onVolumeChange?: (volume: number) => void;
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  ({ videoId, onReady, onStateChange, onTimeUpdate, onDurationChange }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    // Use GitHub Pages for YouTube embed
    const embedUrl = "https://sco-tt.github.io/slow-set/";

    // Message handler for communication with external iframe
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        // Allow messages from GitHub Pages domain
        if (event.origin !== 'https://sco-tt.github.io') return;

        const { type, state, error, time, duration: dur } = event.data;

        switch (type) {
          case 'player-ready':
            setIsReady(true);
            if (onReady) onReady();
            break;
          case 'state-change':
            if (onStateChange) onStateChange(state);
            break;
          case 'error':
            console.error('YouTube Player Error:', error);
            const errorMessages: { [key: number]: string } = {
              2: 'Invalid video ID',
              5: 'HTML5 player error',
              100: 'Video not found or private',
              101: 'Embedding not allowed by video owner',
              150: 'Embedding not allowed by video owner',
              151: 'Embedding not allowed by video owner',
              153: 'Embedding not allowed by video owner'
            };
            const message = errorMessages[error] || `Unknown error: ${error}`;
            alert(`YouTube Error ${error}: ${message}\n\nTry a different video or check if the video allows embedding.`);
            break;
          case 'current-time':
            setCurrentTime(time);
            if (onTimeUpdate) onTimeUpdate(time);
            break;
          case 'duration':
            setDuration(dur);
            if (onDurationChange) onDurationChange(dur);
            break;
          case 'time-update':
            if (event.data.time !== undefined) {
              setCurrentTime(event.data.time);
              if (onTimeUpdate) onTimeUpdate(event.data.time);
            }
            if (event.data.duration !== undefined) {
              setDuration(event.data.duration);
              if (onDurationChange) onDurationChange(event.data.duration);
            }
            break;
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [onReady, onStateChange, onTimeUpdate, onDurationChange]);

    // Load video when videoId changes
    useEffect(() => {
      if (videoId && iframeRef.current) {
        const iframe = iframeRef.current;
        // Load video via GitHub Pages embed with video ID parameter
        iframe.src = `${embedUrl}?v=${videoId}`;

        // Also send load-video command after iframe loads
        setTimeout(() => {
          sendMessage({ type: 'load-video', data: { videoId } });
        }, 1000);
      }
    }, [videoId, embedUrl]);

    // Set up time update interval
    useEffect(() => {
      if (!isReady) return;

      const interval = setInterval(() => {
        sendMessage({ type: 'get-time' });
      }, 1000);

      return () => clearInterval(interval);
    }, [isReady]);

    // Helper function to send messages to external iframe
    const sendMessage = (message: any) => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(message, 'https://sco-tt.github.io');
      }
    };

    // Expose player methods via ref
    useImperativeHandle(ref, () => ({
      playVideo: () => sendMessage({ type: 'play' }),
      pauseVideo: () => sendMessage({ type: 'pause' }),
      setPlaybackRate: (rate: number) => sendMessage({ type: 'set-speed', data: { rate } }),
      getCurrentTime: () => currentTime,
      seekTo: (seconds: number) => sendMessage({ type: 'seek', data: { time: seconds } }),
      getPlayerState: () => -1, // Would need to track state from messages
      getDuration: () => duration,
      setVolume: (_volume: number) => {
        // Volume control would need to be implemented in external player
        console.log('Volume control not yet implemented in external player');
      },
      getVolume: () => 50, // Default volume
    }), [currentTime, duration]);

    return (
      <div className="youtube-player-container">
        <iframe
          ref={iframeRef}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: '#000'
          }}
          allow="autoplay; encrypted-media"
          title="YouTube Player Sidecar"
        />
        {!isReady && (
          <div className="loading">Loading YouTube Player...</div>
        )}
      </div>
    );
  }
);