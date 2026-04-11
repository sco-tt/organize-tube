import { useState, useRef, useCallback } from "react";
import { YouTubePlayer, YouTubePlayerHandle } from "./components/YouTubePlayer";
import { LoopControls } from "./components/LoopControls";
import { LoopProgressBar } from "./components/LoopProgressBar";
import { SetsSidebar } from "./components/SetsSidebar";
import { useLoopControls } from "./hooks/useLoopControls";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { extractVideoId, validateYouTubeUrl } from "./utils/testYouTube";
import "./App.css";

function App() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playerRef = useRef<YouTubePlayerHandle>(null);

  // Loop controls
  const {
    loops,
    activeLoop,
    isLooping,
    setLoopStart,
    setLoopEnd,
    saveLoop,
    deleteLoop,
    selectLoop,
    toggleLooping
  } = useLoopControls({ playerRef, isPlaying });


  const handleUrlSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validateYouTubeUrl(videoUrl)) {
      alert('Please enter a valid YouTube URL');
      return;
    }
    const id = extractVideoId(videoUrl);
    if (id) {
      setVideoId(id);
      setCurrentSpeed(1.0); // Reset speed when loading new video
    }
  }, [videoUrl]);

  const togglePlayPause = useCallback(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const changeSpeed = useCallback((speed: number) => {
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(speed);
      setCurrentSpeed(speed);
    }
  }, []);

  const handlePlayerReady = useCallback(() => {
    console.log('Player is ready for control');
  }, []);

  const handleStateChange = useCallback((state: number) => {
    // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (queued)
    setIsPlaying(state === 1);
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleDurationChange = useCallback((duration: number) => {
    setDuration(duration);
  }, []);

  const handleSeekToTime = useCallback((time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time);
    }
  }, []);

  const handleSeekBackward = useCallback(() => {
    if (playerRef.current) {
      const newTime = Math.max(0, currentTime - 5); // Seek back 5 seconds
      playerRef.current.seekTo(newTime);
    }
  }, [currentTime]);

  const handleSeekForward = useCallback(() => {
    if (playerRef.current) {
      const newTime = Math.min(duration, currentTime + 5); // Seek forward 5 seconds
      playerRef.current.seekTo(newTime);
    }
  }, [currentTime, duration]);

  const handleSetLoopStartShortcut = useCallback(() => {
    const time = Math.floor(currentTime * 100) / 100;
    setLoopStart(time);
  }, [currentTime, setLoopStart]);

  const handleSetLoopEndShortcut = useCallback(() => {
    const time = Math.floor(currentTime * 100) / 100;
    setLoopEnd(time);
  }, [currentTime, setLoopEnd]);

  // Keyboard shortcuts (must be after function declarations)
  useKeyboardShortcuts({
    onSetLoopStart: handleSetLoopStartShortcut,
    onSetLoopEnd: handleSetLoopEndShortcut,
    onToggleLoop: toggleLooping,
    onTogglePlayPause: togglePlayPause,
    onSeekBackward: handleSeekBackward,
    onSeekForward: handleSeekForward
  });

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const speedOptions = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  const handleVideoSelect = useCallback((videoId: string) => {
    setVideoId(videoId);
    setVideoUrl(`https://www.youtube.com/watch?v=${videoId}`);
  }, []);

  const handleUrlBlur = useCallback(() => {
    if (videoUrl && validateYouTubeUrl(videoUrl)) {
      const id = extractVideoId(videoUrl);
      if (id && id !== videoId) {
        setVideoId(id);
        setCurrentSpeed(1.0);
      }
    }
  }, [videoUrl, videoId]);

  return (
    <div className="app-container">
      <div className="app-layout">
        <main className="main-content">
          <h1>Organize Tube</h1>

          <form className="url-form" onSubmit={handleUrlSubmit}>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onBlur={handleUrlBlur}
              placeholder="Enter YouTube URL (e.g., https://youtube.com/watch?v=...)"
              className="url-input"
            />
            <button type="submit">Load Video</button>
          </form>

          {videoId && (
            <div className="video-section">
              <div className="video-container">
                <YouTubePlayer
                  ref={playerRef}
                  videoId={videoId}
                  onReady={handlePlayerReady}
                  onStateChange={handleStateChange}
                  onTimeUpdate={handleTimeUpdate}
                  onDurationChange={handleDurationChange}
                />
              </div>

              <div className="controls">
                <div className="playback-info">
                  <span>Current Time: {formatTime(currentTime)}</span>
                  <span>Speed: {currentSpeed}x</span>
                  {isLooping && activeLoop && (
                    <span className="loop-status">🔁 Looping: {activeLoop.name}</span>
                  )}
                </div>

                <button
                  onClick={togglePlayPause}
                  className="play-pause-btn"
                >
                  {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </button>

                <div className="speed-controls">
                  <label>Practice Speed: </label>
                  {speedOptions.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => changeSpeed(speed)}
                      className={currentSpeed === speed ? 'active' : ''}
                      type="button"
                    >
                      {speed}x
                    </button>
                  ))}
                </div>

                <div className="instructions">
                  <p><strong>How to use:</strong></p>
                  <ul>
                    <li>Paste a YouTube URL and click "Load Video"</li>
                    <li>Use speed controls to slow down for practice</li>
                    <li>Click Play/Pause or use spacebar in the video</li>
                    <li>Lower speeds (0.25x - 0.75x) are perfect for learning difficult parts</li>
                  </ul>

                  <p><strong>⌨️ Keyboard Shortcuts:</strong></p>
                  <ul>
                    <li><kbd>Space</kbd> - Play/Pause</li>
                    <li><kbd>S</kbd> - Set Loop Start</li>
                    <li><kbd>E</kbd> - Set Loop End</li>
                    <li><kbd>L</kbd> - Toggle Loop On/Off</li>
                    <li><kbd>Ctrl/Cmd + ←</kbd> - Seek backward 5s</li>
                    <li><kbd>Ctrl/Cmd + →</kbd> - Seek forward 5s</li>
                  </ul>
                </div>
              </div>

              {/* Progress Bar with Loop Visualization */}
              <LoopProgressBar
                currentTime={currentTime}
                duration={duration}
                activeLoop={activeLoop}
                onSeekToTime={handleSeekToTime}
              />

              {/* Loop Controls */}
              <LoopControls
                currentTime={currentTime}
                activeLoop={activeLoop}
                loops={loops}
                isLooping={isLooping}
                onSetLoopStart={setLoopStart}
                onSetLoopEnd={setLoopEnd}
                onToggleLoop={toggleLooping}
                onSelectLoop={selectLoop}
                onSaveLoop={saveLoop}
                onDeleteLoop={deleteLoop}
              />
            </div>
          )}

          {!videoId && (
            <div className="placeholder">
              <h2>🎵 Welcome to Organize Tube!</h2>
              <p>Enter a YouTube URL above to start practicing music at your own pace.</p>
              <p>Perfect for musicians who need to slow down songs to learn difficult passages.</p>
            </div>
          )}
        </main>

        <aside className="sidebar">
          <SetsSidebar onVideoSelect={handleVideoSelect} />
        </aside>
      </div>
    </div>
  );
}

export default App;