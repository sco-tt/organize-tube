import { useState, useRef, useCallback, useEffect } from "react";
import { YouTubePlayer, YouTubePlayerHandle } from "./components/YouTubePlayer";
import { LoopProgressBar } from "./components/LoopProgressBar";
import { SidebarTabs } from "./components/SidebarTabs/SidebarTabs";
import { InstructionsModal } from "./components/InstructionsModal/InstructionsModal";
import { SpeedControlModal } from "./components/SpeedControlModal/SpeedControlModal";
import { LoadVideoModal } from "./components/LoadVideoModal/LoadVideoModal";
import { MySongsModal } from "./components/MySongsModal/MySongsModal";
import { CustomFieldsModal } from "./components/CustomFieldsModal/CustomFieldsModal";
import { ToolsModal } from "./components/ToolsModal/ToolsModal";
import { SetlistPrinterModal } from "./components/SetlistPrinterModal/SetlistPrinterModal";
import { SongInfoPanel } from "./components/SongInfoPanel/SongInfoPanel";
import { Toast } from "./components/Toast/Toast";
import { useLoopControlsSQLite } from "./hooks/useLoopControlsSQLite";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useModal } from "./hooks/useModal";
import { useSavedSongs } from "./hooks/useSavedSongs";
import { TagAutocomplete } from "./components/TagAutocomplete/TagAutocomplete";
import { TagsService } from "./services/tagsService";
import { SongRoutine } from "./repositories/songRoutineRepository";
import { Mp3DownloadService } from "./services/mp3DownloadService";
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
  const toolsModal = useModal();
  const setlistPrinterModal = useModal();

  // State for tag filtering in MySongsModal
  const [mySongsInitialTagFilter, setMySongsInitialTagFilter] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isSavingSong, setIsSavingSong] = useState(false);
  const [songTags, setSongTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [volume, setVolume] = useState(100);
  const [currentSong, setCurrentSong] = useState<SongRoutine | null>(null);
  const [isMp3DownloadEnabled, setIsMp3DownloadEnabled] = useState(false);
  const [isDownloadingMp3, setIsDownloadingMp3] = useState(false);

  const playerRef = useRef<YouTubePlayerHandle>(null);

  // Get volume settings from localStorage
  const getVolumeSettings = useCallback((): { defaultVolume: number; onlyForNewVideos: boolean } => {
    try {
      const savedSettings = localStorage.getItem('segment-studio-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        return {
          defaultVolume: settings.defaultVolume || 100,
          onlyForNewVideos: settings.defaultVolumeOnlyForNewVideos || false
        };
      }
    } catch (error) {
      console.warn('Failed to read volume settings:', error);
    }
    return { defaultVolume: 100, onlyForNewVideos: false };
  }, []);

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
    updateLoop,
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

  // Wrapper function to match the LoopControls interface
  const handleUpdateLoop = useCallback((loopId: string, name: string, startTime: number, endTime: number) => {
    updateLoop(loopId, { name, start_time: startTime, end_time: endTime });
  }, [updateLoop]);


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

    // Apply default volume when player is ready, with a small delay to prevent restarts
    setTimeout(() => {
      const { defaultVolume, onlyForNewVideos } = getVolumeSettings();
      const volumeToUse = onlyForNewVideos && currentSong?.volume ? currentSong.volume : defaultVolume;
      changeVolume(volumeToUse);
      console.log('Applied volume on player ready:', volumeToUse, { defaultVolume, onlyForNewVideos, songVolume: currentSong?.volume });
    }, 100);
  }, [getVolumeSettings, changeVolume, currentSong]);

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

  // Copy video link to clipboard
  const handleCopyLink = useCallback(async () => {
    if (!videoUrl) return;

    try {
      await navigator.clipboard.writeText(videoUrl);
      showToastNotification('🔗 Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      showToastNotification('❌ Failed to copy link');
    }
  }, [videoUrl, showToastNotification]);

  // Download video as MP3
  const handleDownloadMp3 = useCallback(async () => {
    if (!videoUrl || !isMp3DownloadEnabled) return;

    setIsDownloadingMp3(true);

    try {
      const downloadService = Mp3DownloadService.getInstance();

      // Generate filename from current song data or video title
      const filename = currentSong?.title || currentSong?.name || `youtube_${videoId}`;

      showToastNotification('🎵 Starting MP3 download...');

      const result = await downloadService.downloadMp3(videoUrl, filename);

      if (result.success) {
        showToastNotification('✅ MP3 download completed!');

        // Optionally, add the downloaded MP3 to the song database
        if (currentSong && result.filePath) {
          // Could add a local_file_path field to the song record
          console.log('MP3 downloaded to:', result.filePath);
        }
      } else {
        showToastNotification(`❌ Download failed: ${result.message}`);
      }
    } catch (error) {
      console.error('MP3 download error:', error);
      showToastNotification('❌ Download failed with unknown error');
    } finally {
      setIsDownloadingMp3(false);
    }
  }, [videoUrl, videoId, currentSong, isMp3DownloadEnabled, showToastNotification]);

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

  // Essential speeds from settings - reactive to settings changes
  const [essentialSpeeds, setEssentialSpeeds] = useState<number[]>([0.5, 0.7, 0.8, 0.9, 1.0]);
  const allSpeedOptions = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  // Load speeds from settings on component mount and settings changes
  useEffect(() => {
    const loadSpeedsFromSettings = () => {
      try {
        const savedSettings = localStorage.getItem('segment-studio-settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          if (settings.defaultPlaybackSpeeds && Array.isArray(settings.defaultPlaybackSpeeds)) {
            setEssentialSpeeds(settings.defaultPlaybackSpeeds);
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to read speed settings:', error);
      }
      // Fallback to default essential speeds
      setEssentialSpeeds([0.5, 0.7, 0.8, 0.9, 1.0]);
    };

    loadSpeedsFromSettings();

    // Listen for settings changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'segment-studio-settings') {
        loadSpeedsFromSettings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Check if MP3 download feature is enabled
  useEffect(() => {
    const checkMp3Feature = async () => {
      try {
        const downloadService = Mp3DownloadService.getInstance();
        const isEnabled = await downloadService.isDownloadEnabled();
        setIsMp3DownloadEnabled(isEnabled);
      } catch (error) {
        console.error('Failed to check MP3 download feature:', error);
        setIsMp3DownloadEnabled(false);
      }
    };

    checkMp3Feature();
  }, []);


  const handleVideoLoad = useCallback((videoId: string, videoUrl: string) => {
    setVideoId(videoId);
    setVideoUrl(videoUrl);
    setCurrentSpeed(1.0); // Reset speed when loading new video
    clearLoopsDisplay(); // Clear any displayed loops and stop looping
    setSongTags([]); // Clear tags for new video
    const { defaultVolume } = getVolumeSettings();
    setVolume(defaultVolume); // Use default volume from settings
    changeVolume(defaultVolume); // Actually set the player volume
    setCurrentSong(null); // Clear current song when loading new video
  }, [clearLoopsDisplay, getVolumeSettings, changeVolume]);

  const addTag = useCallback(async (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !songTags.includes(trimmedTag)) {
      const newTags = [...songTags, trimmedTag];
      setSongTags(newTags);

      // Add to tags service cache for immediate availability
      TagsService.getInstance().addToCache([trimmedTag]);

      // Auto-save tags if this is a saved song
      if (currentSong?.id) {
        try {
          await updateSong(currentSong.id, { tags_json: JSON.stringify(newTags) });
          console.log('Tags auto-saved for song:', currentSong.id);
        } catch (error) {
          console.error('Failed to auto-save tags:', error);
        }
      }
    }
  }, [songTags, currentSong, updateSong]);

  const addTagFromInput = useCallback(async () => {
    const tag = newTag.trim();
    if (tag && !songTags.includes(tag)) {
      await addTag(tag);
      setNewTag('');
    }
  }, [newTag, songTags, addTag]);

  const removeTag = useCallback(async (tagToRemove: string) => {
    const newTags = songTags.filter(tag => tag !== tagToRemove);
    setSongTags(newTags);

    // Auto-save tags if this is a saved song
    if (currentSong?.id) {
      try {
        await updateSong(currentSong.id, { tags_json: JSON.stringify(newTags) });
        console.log('Tags auto-saved after removal for song:', currentSong.id);
      } catch (error) {
        console.error('Failed to auto-save tags after removal:', error);
      }
    }
  }, [songTags, currentSong, updateSong]);

  const handleTagClick = useCallback((tag: string) => {
    // Set the initial tag filter and open the MySongsModal
    setMySongsInitialTagFilter(tag);
    mySongsModal.open();
  }, [mySongsModal]);

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
        volume: volume || 100,
        tags_json: JSON.stringify(songTags)
      };

      console.log('Attempting to save song data:', songData);
      const savedSongId = await saveSong(songData);

      // Update currentSong state to reflect that this video is now saved
      if (savedSongId) {
        const newSong: SongRoutine = {
          id: savedSongId,
          name: songData.name,
          title: songData.title,
          artist: songData.artist,
          url: songData.url,
          url_source: 'youtube',
          duration: songData.duration,
          notes: songData.notes,
          freeform_notes: songData.freeform_notes,
          volume: songData.volume,
          created_at: new Date().toISOString(),
          last_practiced: undefined,
          tags_json: JSON.stringify(songTags),
          loops_json: '[]',
          steps_json: '[]',
          links_json: '[]'
        };
        setCurrentSong(newSong);
      }

      // Save any standalone segments as segments for this song
      if (loops.length > 0) {
        // TODO: Save loops as segments for this song
      }

      // Clear tags cache to ensure fresh autocomplete data
      TagsService.getInstance().clearCache();

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
    console.log('🎵 handleSongSelect: Called with songId:', songId, 'songUrl:', songUrl);
    const id = extractVideoId(songUrl);
    console.log('handleSongSelect: Extracted video ID:', id);

    if (id) {
      console.log('handleSongSelect: Loading video with ID:', id);
      setVideoId(id);
      setVideoUrl(songUrl);
      setCurrentSpeed(1.0);

      // Stop any active looping when switching songs
      if (isLooping) {
        toggleLooping();
      }

      // Load segments for this specific song (this will replace any existing segments)
      await loadSegmentsForRoutine(songId);

      // Load the full song data
      try {
        const songData = await findSongById(songId);
        console.log('🎵 Full song data loaded:', songData);
        console.log('🎵 songData.tags_json:', songData?.tags_json);
        setCurrentSong(songData);

        // Set volume based on settings
        const { defaultVolume, onlyForNewVideos } = getVolumeSettings();
        const volumeToUse = onlyForNewVideos && songData?.volume ? songData.volume : defaultVolume;
        setVolume(volumeToUse);
        changeVolume(volumeToUse); // Actually set the player volume

        // Load tags for this song
        console.log('Loading tags for song:', songData?.id, 'tags_json:', songData?.tags_json);
        try {
          const songTags = JSON.parse(songData?.tags_json || '[]');
          console.log('Parsed tags:', songTags);
          if (Array.isArray(songTags)) {
            setSongTags(songTags);
            console.log('Set tags to:', songTags);
          } else {
            console.log('Tags not array, clearing');
            setSongTags([]);
          }
        } catch (tagError) {
          console.warn('Failed to parse song tags:', tagError);
          setSongTags([]);
        }
      } catch (error) {
        console.error('Failed to load song data:', error);
        setSongTags([]); // Clear tags if song loading fails
      }

      showToastNotification('Song loaded successfully! 🎵');
    } else {
      console.error('handleSongSelect: Could not extract video ID from URL:', songUrl);
      showToastNotification(`Invalid YouTube URL: "${songUrl}". Please edit the song and add a valid YouTube URL.`);
    }
  }, [isLooping, toggleLooping, loadSegmentsForRoutine, showToastNotification, findSongById, getVolumeSettings, changeVolume]);

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

                  <button
                    className="tools-link"
                    onClick={toolsModal.open}
                    type="button"
                    title="Music practice tools"
                    style={{
                      background: 'transparent',
                      color: '#6f42c1',
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontWeight: '500',
                      border: '1px solid #6f42c1',
                      borderRadius: '4px',
                      width: '100%',
                      marginTop: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    🎯 Practice Tools
                  </button>

                  <button
                    className="setlist-printer-link"
                    onClick={setlistPrinterModal.open}
                    type="button"
                    title="Create printable setlists"
                    style={{
                      background: 'transparent',
                      color: '#dc3545',
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontWeight: '500',
                      border: '1px solid #dc3545',
                      borderRadius: '4px',
                      width: '100%',
                      marginTop: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    📄 Print Setlist
                  </button>
                </div>

                <div className="tags-section">
                  <div className="tags-header">
                    <label>🏷️ Tags:</label>
                  </div>
                  <div className="tags-container">
                    {songTags.map((tag) => (
                      <span key={tag} className="tag-item">
                        <button
                          onClick={() => handleTagClick(tag)}
                          className="tag-text-button"
                          title={`Find other songs with tag: ${tag}`}
                        >
                          🏷️ {tag}
                        </button>
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
                    <TagAutocomplete
                      value={newTag}
                      placeholder="Add tag..."
                      currentTags={songTags}
                      onValueChange={setNewTag}
                      onTagAdd={async (tag) => {
                        await addTag(tag);
                        setNewTag('');
                      }}
                      className="tag-autocomplete-input"
                    />
                    <button
                      onClick={addTagFromInput}
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
                {videoId && videoUrl && (
                  <div className="video-controls-top">
                    <button
                      onClick={handleCopyLink}
                      className="copy-link-btn"
                      title="Copy video link to clipboard"
                    >
                      🔗 copy link
                    </button>
                    {isMp3DownloadEnabled && (
                      <button
                        onClick={handleDownloadMp3}
                        className="download-mp3-btn"
                        disabled={isDownloadingMp3}
                        title="Download video as MP3"
                      >
                        {isDownloadingMp3 ? '⏳ downloading...' : '⬇️ download mp3'}
                      </button>
                    )}
                  </div>
                )}
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
            currentSongId={currentSong?.id}
            onSetLoopStart={setLoopStart}
            onSetLoopEnd={setLoopEnd}
            onToggleLoop={toggleLooping}
            onSelectLoop={selectLoop}
            onSaveLoop={saveLoop}
            onDeleteLoop={deleteLoop}
            onUpdateLoop={handleUpdateLoop}
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
        initialTagFilter={mySongsInitialTagFilter}
      />

      <CustomFieldsModal
        isOpen={customFieldsModal.isOpen}
        onClose={customFieldsModal.close}
      />

      <ToolsModal
        isOpen={toolsModal.isOpen}
        onClose={toolsModal.close}
      />

      <SetlistPrinterModal
        isOpen={setlistPrinterModal.isOpen}
        onClose={setlistPrinterModal.close}
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