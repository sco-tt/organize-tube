import { useState, useRef, useCallback } from "react";
import { YouTubePlayer, YouTubePlayerHandle } from "./components/YouTubePlayer";
import { LoopProgressBar } from "./components/LoopProgressBar";
import { SidebarTabs } from "./components/SidebarTabs/SidebarTabs";
import { InstructionsModal } from "./components/InstructionsModal/InstructionsModal";
import { SpeedControlModal } from "./components/SpeedControlModal/SpeedControlModal";
import { LoadVideoModal } from "./components/LoadVideoModal/LoadVideoModal";
import { Toast } from "./components/Toast/Toast";
import { useLoopControls } from "./hooks/useLoopControls";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useModal } from "./hooks/useModal";
import { extractVideoId, validateYouTubeUrl } from "./utils/testYouTube";
import "./App.css";

function App() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const instructionsModal = useModal();
  const speedModal = useModal();
  const loadVideoModal = useModal();

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

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
    toggleLooping,
    clearLoops
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
      clearLoops(); // Clear any temporary loops
    }
  }, [videoUrl, clearLoops]);

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

  const showToastNotification = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
  }, []);

  const handleSetLoopStartShortcut = useCallback(() => {
    const time = Math.floor(currentTime * 100) / 100;
    setLoopStart(time);
    showToastNotification(`Loop start set: ${formatTime(time)}`);
  }, [currentTime, setLoopStart, showToastNotification]);

  const handleSetLoopEndShortcut = useCallback(() => {
    const time = Math.floor(currentTime * 100) / 100;
    setLoopEnd(time);
    showToastNotification(`Loop end set: ${formatTime(time)}`);
  }, [currentTime, setLoopEnd, showToastNotification]);

  const handleToggleLoopShortcut = useCallback(() => {
    toggleLooping();
    // Show appropriate toast based on current loop state
    const message = isLooping ? 'Temporary Loop Stopped' : 'Temporary Loop Started';
    showToastNotification(message);
  }, [toggleLooping, isLooping, showToastNotification]);

  // Keyboard shortcuts (must be after function declarations)
  useKeyboardShortcuts({
    onSetLoopStart: handleSetLoopStartShortcut,
    onSetLoopEnd: handleSetLoopEndShortcut,
    onToggleLoop: handleToggleLoopShortcut,
    onTogglePlayPause: togglePlayPause,
    onSeekBackward: handleSeekBackward,
    onSeekForward: handleSeekForward,
    onShowHelp: instructionsModal.open
  });

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const essentialSpeeds = [0.5, 0.7, 0.8, 0.9, 1.0];
  const allSpeedOptions = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  const handleVideoSelect = useCallback((videoId: string) => {
    setVideoId(videoId);
    setVideoUrl(`https://www.youtube.com/watch?v=${videoId}`);
    clearLoops(); // Clear any temporary loops
  }, [clearLoops]);

  const handleVideoLoad = useCallback((videoId: string, videoUrl: string) => {
    setVideoId(videoId);
    setVideoUrl(videoUrl);
    setCurrentSpeed(1.0); // Reset speed when loading new video
    clearLoops(); // Clear any temporary loops
  }, [clearLoops]);

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
    <div className="app-container" tabIndex={0}>
      <div className="app-layout">
        <main className="main-content">
          <div className="app-header">
            <h1>Organize Tube</h1>
            <button
              onClick={loadVideoModal.open}
              className="load-video-button"
              type="button"
            >
              📹 Load Video
            </button>
          </div>

          {videoId && (
            <div className="video-section">
              <div className="video-and-controls">
                <div className="controls-sidebar">
                  <div className="playback-row">
                    <span>Current Time:<br/>{formatTime(currentTime)}</span>
                    <button
                      onClick={togglePlayPause}
                      className="play-pause-btn"
                    >
                      {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                    </button>
                  </div>

                  {isLooping && activeLoop && (
                    <div className="status-info">
                      <span className="loop-status">🔁 Looping: {activeLoop.name}</span>
                    </div>
                  )}

                  <div className="speed-controls">
                    <div className="speed-header">
                      <label>Practice Speed:</label>
                      <span className="current-speed">Current: {currentSpeed}x</span>
                    </div>
                    <div className="speed-buttons">
                      {essentialSpeeds.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => changeSpeed(speed)}
                        className={currentSpeed === speed ? 'active' : ''}
                        type="button"
                      >
                        {speed}x
                      </button>
                    ))}
                      <button
                        onClick={speedModal.open}
                        className="more-speeds-btn"
                        type="button"
                        title="More speed options"
                      >
                        More...
                      </button>
                    </div>
                  </div>

                  <div className="help-section">
                    <button
                      className="help-button"
                      onClick={instructionsModal.open}
                      type="button"
                      title="Show help and keyboard shortcuts"
                      style={{ background: 'red', color: 'white', padding: '6px 8px', fontSize: '11px' }}
                    >
                      📚 Help & Shortcuts
                    </button>
                  </div>
                </div>

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
              </div>

              {/* Progress Bar with Loop Visualization */}
              <LoopProgressBar
                currentTime={currentTime}
                duration={duration}
                activeLoop={activeLoop}
                onSeekToTime={handleSeekToTime}
                onSetLoopStart={setLoopStart}
                onSetLoopEnd={setLoopEnd}
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
          <SidebarTabs
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
            onVideoSelect={handleVideoSelect}
          />
        </aside>
      </div>

      <InstructionsModal
        isOpen={instructionsModal.isOpen}
        onClose={instructionsModal.close}
      />

      <SpeedControlModal
        isOpen={speedModal.isOpen}
        onClose={speedModal.close}
        currentSpeed={currentSpeed}
        onSpeedChange={changeSpeed}
        allSpeedOptions={allSpeedOptions}
      />

      <LoadVideoModal
        isOpen={loadVideoModal.isOpen}
        onClose={loadVideoModal.close}
        onVideoLoad={handleVideoLoad}
        currentVideoUrl={videoUrl}
      />

      <Toast
        message={toastMessage}
        show={showToast}
        onHide={() => setShowToast(false)}
      />
    </div>
  );
}

export default App;