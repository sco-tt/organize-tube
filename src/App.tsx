import { useState, useRef, useCallback } from "react";
import { YouTubePlayer, YouTubePlayerHandle } from "./components/YouTubePlayer";
import { LoopProgressBar } from "./components/LoopProgressBar";
import { SidebarTabs } from "./components/SidebarTabs/SidebarTabs";
import { InstructionsModal } from "./components/InstructionsModal/InstructionsModal";
import { SpeedControlModal } from "./components/SpeedControlModal/SpeedControlModal";
import { LoadVideoModal } from "./components/LoadVideoModal/LoadVideoModal";
import { MySongsModal } from "./components/MySongsModal/MySongsModal";
import { CustomFieldsModal } from "./components/CustomFieldsModal/CustomFieldsModal";
import { SongInfoPanel } from "./components/SongInfoPanel/SongInfoPanel";
import { Toast } from "./components/Toast/Toast";
import { useLoopControlsSQLite } from "./hooks/useLoopControlsSQLite";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useModal } from "./hooks/useModal";
import { useSavedSongs } from "./hooks/useSavedSongs";
import { SongRoutine } from "./repositories/songRoutineRepository";
// Inline video ID extraction function
function extractVideoId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : '';
}
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
  const mySongsModal = useModal();
  const customFieldsModal = useModal();

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isSavingSong, setIsSavingSong] = useState(false);
  const [songTags, setSongTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [volume, setVolume] = useState(100);
  const [currentSong, setCurrentSong] = useState<SongRoutine | null>(null);

  const playerRef = useRef<YouTubePlayerHandle>(null);

  // Saved songs
  const {
    saveSong,
    checkUrlExists,
    updateSong,
    findSongById
  } = useSavedSongs();

  // Loop controls
  const {
    loops,
    activeLoop,
    isLooping,
    tempStart,
    tempEnd,
    setLoopStart,
    setLoopEnd,
    saveLoop,
    deleteLoop,
    selectLoop,
    toggleLooping,
    clearLoops,
    clearLoopsDisplay,
    clearTempPoints,
    changeTempStart,
    changeTempEnd,
    loadSegmentsForRoutine,
    loadStandaloneSegments
  } = useLoopControlsSQLite({ playerRef, isPlaying });



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

  const changeVolume = useCallback((newVolume: number) => {
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
      setVolume(newVolume);
    }
  }, []);

  const handlePlayerReady = useCallback(() => {
    console.log('Player is ready for control');
    // Note: Don't set volume here as it causes restarts
    // Volume will be synced through the monitoring interval
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

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
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


  const handleVideoLoad = useCallback((videoId: string, videoUrl: string) => {
    setVideoId(videoId);
    setVideoUrl(videoUrl);
    setCurrentSpeed(1.0); // Reset speed when loading new video
    clearLoopsDisplay(); // Clear any displayed loops but keep saved segments
    setSongTags([]); // Clear tags for new video
    setVolume(100); // Reset volume for new video
    setCurrentSong(null); // Clear current song when loading new video
  }, [clearLoopsDisplay]);

  const addTag = useCallback(() => {
    const tag = newTag.trim();
    if (tag && !songTags.includes(tag)) {
      setSongTags(prev => [...prev, tag]);
      setNewTag('');
    }
  }, [newTag, songTags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setSongTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  const fetchVideoTitle = useCallback(async (videoId: string): Promise<{title: string, author: string}> => {
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (response.ok) {
        const data = await response.json();
        return {
          title: data.title || `Video ${videoId}`,
          author: data.author_name || 'Unknown Artist'
        };
      }
    } catch (error) {
      console.error('Failed to fetch video title:', error);
    }

    return {
      title: `Video ${videoId}`,
      author: 'Unknown Artist'
    };
  }, []);

  const handleSaveSong = useCallback(async () => {
    if (!videoId || !videoUrl) {
      showToastNotification('No video loaded to save');
      return;
    }

    setIsSavingSong(true);

    try {
      // Get video title and artist from YouTube oEmbed API
      console.log('Fetching video title for:', videoId);
      const { title: videoTitle, author: videoArtist } = await fetchVideoTitle(videoId);
      console.log('Got video info:', { videoTitle, videoArtist });

      // Check if URL already exists
      console.log('Checking if URL exists:', videoUrl);
      const urlExists = await checkUrlExists(videoUrl);
      if (urlExists) {
        showToastNotification('This video is already saved!');
        setIsSavingSong(false);
        return;
      }

      const songData = {
        name: videoTitle || 'Untitled',
        title: videoTitle || '',
        artist: videoArtist || '',
        url: videoUrl,
        duration: duration || 0,
        notes: '',
        freeform_notes: '',
        volume: volume || 100
      };

      console.log('Attempting to save song data:', songData);
      await saveSong(songData);

      // Save any standalone segments as segments for this song
      if (loops.length > 0) {
        // TODO: Save loops as segments for this song
      }

      showToastNotification(`"${videoTitle || 'Song'}" saved successfully! 💾`);
      setIsSavingSong(false);
    } catch (error) {
      console.error('Failed to save song - Full error object:', error);
      console.error('Error type:', typeof error);
      console.error('Error toString:', error?.toString());
      console.error('Error stack:', (error as any)?.stack);

      let errorMessage = 'Unknown error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }

      console.error('Final error message:', errorMessage);
      showToastNotification(`Failed to save song: ${errorMessage}`);
      setIsSavingSong(false);
    }
  }, [videoId, videoUrl, duration, loops, songTags, showToastNotification, fetchVideoTitle, saveSong, checkUrlExists]);

  const handleSongSelect = useCallback(async (songId: string, songUrl: string) => {
    console.log('handleSongSelect: Called with songId:', songId, 'songUrl:', songUrl);
    const id = extractVideoId(songUrl);
    console.log('handleSongSelect: Extracted video ID:', id);

    if (id) {
      console.log('handleSongSelect: Loading video with ID:', id);
      setVideoId(id);
      setVideoUrl(songUrl);
      setCurrentSpeed(1.0);

      // Load segments for this specific song
      loadSegmentsForRoutine(songId);

      // Load the full song data
      try {
        const songData = await findSongById(songId);
        setCurrentSong(songData);

        // Set volume from song data
        if (songData?.volume) {
          setVolume(songData.volume);
        }
      } catch (error) {
        console.error('Failed to load song data:', error);
      }

      // TODO: Load tags for this song
      setSongTags([]);

      showToastNotification('Song loaded successfully! 🎵');
    } else {
      console.error('handleSongSelect: Could not extract video ID from URL:', songUrl);
      showToastNotification(`Invalid YouTube URL: "${songUrl}". Please edit the song and add a valid YouTube URL.`);
    }
  }, [loadSegmentsForRoutine, showToastNotification, findSongById]);

  const handleSongUpdate = useCallback(async (updatedSong: SongRoutine) => {
    try {
      if (!currentSong) return;

      // Calculate what changed
      const updates: Partial<SongRoutine> = {};
      if (updatedSong.title !== currentSong.title) updates.title = updatedSong.title;
      if (updatedSong.artist !== currentSong.artist) updates.artist = updatedSong.artist;
      if (updatedSong.notes !== currentSong.notes) updates.notes = updatedSong.notes;
      if (updatedSong.volume !== currentSong.volume) updates.volume = updatedSong.volume;
      if (updatedSong.freeform_notes !== currentSong.freeform_notes) updates.freeform_notes = updatedSong.freeform_notes;

      if (Object.keys(updates).length > 0) {
        await updateSong(currentSong.id, updates);
        setCurrentSong(updatedSong);

        // Update volume in player if it changed
        if (updatedSong.volume !== volume) {
          setVolume(updatedSong.volume);
          changeVolume(updatedSong.volume);
        }

        showToastNotification('Song updated successfully! ✅');
      }
    } catch (error) {
      console.error('Failed to update song:', error);
      showToastNotification('Failed to update song');
    }
  }, [updateSong, currentSong, volume, changeVolume, showToastNotification]);


  return (
    <div className="app-container" tabIndex={0}>
      <div className="app-layout">
        <main className="main-content">
          <div className="app-header">
            <h1>Segment Studio</h1>
            <button
              onClick={loadVideoModal.open}
              className="load-video-button"
              type="button"
            >
              📹 Load Video
            </button>
          </div>

          <div className="video-section">
              <div className="controls-sidebar">
                <div className="playback-row">
                  <span>Current Time:<br/>{videoId ? formatTime(currentTime) : '--:--'}</span>
                  <button
                    onClick={togglePlayPause}
                    className="play-pause-btn"
                    disabled={!videoId}
                    style={{ opacity: !videoId ? 0.5 : 1 }}
                  >
                    {!videoId ? '▶️ Play' : isPlaying ? '⏸️ Pause' : '▶️ Play'}
                  </button>
                </div>

                <div className="volume-control">
                  <div className="volume-header">
                    <label>🔊 Volume:</label>
                    <span className="volume-value">{volume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => changeVolume(Number(e.target.value))}
                    className="volume-slider"
                    disabled={!videoId}
                    style={{ opacity: !videoId ? 0.5 : 1 }}
                  />
                </div>

                <div className="status-info">
                  <span className={isLooping && activeLoop ? "loop-status" : "full-song-status"}>
                    {!videoId ? "🎵 No video loaded" : isLooping && activeLoop ? `🔁 Looping: ${activeLoop.name}` : "🎵 Playing full song"}
                  </span>
                  {videoId && (
                    <span className="saved-status">
                      {currentSong ? "💾 Saved" : "❌ Unsaved"}
                    </span>
                  )}
                </div>

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
                      disabled={!videoId}
                      style={{ opacity: !videoId ? 0.5 : 1 }}
                    >
                      {speed}x
                    </button>
                  ))}
                    <button
                      onClick={speedModal.open}
                      className="more-speeds-btn"
                      type="button"
                      title="More speed options"
                      disabled={!videoId}
                      style={{ opacity: !videoId ? 0.5 : 1 }}
                    >
                      More...
                    </button>
                  </div>
                </div>

                <div className="save-song-section">
                  <button
                    className="save-song-button"
                    onClick={handleSaveSong}
                    disabled={!videoId || isSavingSong}
                    type="button"
                    title="Save current video as a song routine"
                    style={{
                      background: !videoId ? '#6c757d' : isSavingSong ? '#fd7e14' : '#28a745',
                      color: 'white',
                      padding: '8px 12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      border: 'none',
                      width: '100%',
                      cursor: !videoId || isSavingSong ? 'not-allowed' : 'pointer',
                      opacity: !videoId || isSavingSong ? 0.7 : 1
                    }}
                  >
                    {isSavingSong ? '⏳ Saving...' : '💾 Save Song'}
                  </button>

                  <button
                    className="my-songs-link"
                    onClick={mySongsModal.open}
                    type="button"
                    title="View saved songs"
                    style={{
                      background: 'transparent',
                      color: '#007bff',
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontWeight: '500',
                      border: '1px solid #007bff',
                      borderRadius: '4px',
                      width: '100%',
                      marginTop: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    📂 My Songs
                  </button>

                  <button
                    className="custom-fields-link"
                    onClick={customFieldsModal.open}
                    type="button"
                    title="Manage custom fields"
                    style={{
                      background: 'transparent',
                      color: '#059669',
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontWeight: '500',
                      border: '1px solid #059669',
                      borderRadius: '4px',
                      width: '100%',
                      marginTop: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    🎛️ Custom Fields
                  </button>
                </div>

                <div className="tags-section">
                  <div className="tags-header">
                    <label>🏷️ Tags:</label>
                  </div>
                  <div className="tags-container">
                    {songTags.map((tag) => (
                      <span key={tag} className="tag-item">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="tag-remove"
                          title="Remove tag"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="add-tag">
                    <input
                      type="text"
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      className="tag-input"
                      autoCapitalize="none"
                      style={{
                        fontSize: '10px',
                        padding: '4px 6px',
                        border: '1px solid #ddd',
                        borderRadius: '3px',
                        width: '100px',
                        textTransform: 'none'
                      }}
                    />
                    <button
                      onClick={addTag}
                      disabled={!newTag.trim()}
                      className="add-tag-btn"
                      style={{
                        fontSize: '10px',
                        padding: '4px 8px',
                        marginLeft: '4px',
                        backgroundColor: newTag.trim() ? '#28a745' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: newTag.trim() ? 'pointer' : 'not-allowed'
                      }}
                    >
                      +
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

              <div className="video-area">
                <div className="video-container">
                {videoId ? (
                  <YouTubePlayer
                    ref={playerRef}
                    videoId={videoId}
                    onReady={handlePlayerReady}
                    onStateChange={handleStateChange}
                    onTimeUpdate={handleTimeUpdate}
                    onDurationChange={handleDurationChange}
                    onVolumeChange={handleVolumeChange}
                  />
                ) : (
                  <div className="video-placeholder">
                    <div className="placeholder-content">
                      <h2>🎯 Welcome to Segment Studio!</h2>
                      <p>Click "📹 Load Video" above to start practicing music at your own pace.</p>
                      <p>Perfect for musicians who need to slow down songs to learn difficult passages.</p>
                      <div className="placeholder-features">
                        <div className="feature">
                          <span>🎯</span>
                          <span>Set precise segments for looping</span>
                        </div>
                        <div className="feature">
                          <span>🐌</span>
                          <span>Slow down playback speed</span>
                        </div>
                        <div className="feature">
                          <span>⌨️</span>
                          <span>Use keyboard shortcuts (S/E/R)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                </div>

                {/* Song Information Panel - underneath video */}
                <SongInfoPanel
                  song={currentSong}
                  onSongUpdate={handleSongUpdate}
                />

                {/* Progress Bar with Loop Visualization */}
                {videoId ? (
                  <LoopProgressBar
                    currentTime={currentTime}
                    duration={duration}
                    activeLoop={activeLoop}
                    onSeekToTime={handleSeekToTime}
                    onSetLoopStart={setLoopStart}
                    onSetLoopEnd={setLoopEnd}
                  />
                ) : (
                  <div className="progress-placeholder">
                    <span>🎼 Progress bar will appear when video is loaded</span>
                  </div>
                )}
              </div>
          </div>
        </main>

        <aside className="sidebar">
          <SidebarTabs
            currentTime={currentTime}
            activeLoop={activeLoop}
            loops={loops}
            isLooping={isLooping}
            tempStart={tempStart}
            tempEnd={tempEnd}
            onSetLoopStart={setLoopStart}
            onSetLoopEnd={setLoopEnd}
            onToggleLoop={toggleLooping}
            onSelectLoop={selectLoop}
            onSaveLoop={saveLoop}
            onDeleteLoop={deleteLoop}
            onClearTempPoints={clearTempPoints}
            onChangeTempStart={changeTempStart}
            onChangeTempEnd={changeTempEnd}
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

      <MySongsModal
        isOpen={mySongsModal.isOpen}
        onClose={mySongsModal.close}
        onSongSelect={handleSongSelect}
      />

      <CustomFieldsModal
        isOpen={customFieldsModal.isOpen}
        onClose={customFieldsModal.close}
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