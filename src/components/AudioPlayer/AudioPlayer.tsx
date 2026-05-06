import { useState, useEffect, useCallback } from 'react';
import './AudioPlayer.css';
import { Mp3UploadService } from '../../services/mp3UploadService';

interface AudioPlayerProps {
  title: string;
  contentType: 'single_track' | 'stem_group';
  mp3ContentId: string;
  onError?: (error: string) => void;
}

interface TrackState {
  audio: HTMLAudioElement;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

export function AudioPlayer({ title, contentType, mp3ContentId, onError }: AudioPlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [tracks, setTracks] = useState<Map<string, TrackState>>(new Map());
  const [masterVolume, setMasterVolume] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackInfos, setTrackInfos] = useState<any[]>([]);
  const [currentContentId, setCurrentContentId] = useState<string>('');

  const uploadService = Mp3UploadService.getInstance();

  const loadTracks = useCallback(async () => {
    setIsLoading(true);

    // Only cleanup if we're loading different content
    if (currentContentId !== mp3ContentId) {
      tracks.forEach(track => {
        track.audio.pause();
        track.audio.src = '';
      });
      setTracks(new Map());
      setIsPlaying(false);
      setCurrentContentId(mp3ContentId);
    }

    try {
      if (contentType === 'single_track') {
        // For single tracks, mp3ContentId is the track ID, we need to get the audio_file_id
        // Query the audio_tracks table to get the audio_file_id for this track
        const audioFileId = await uploadService.getAudioFileIdForTrack(mp3ContentId);

        // Load single audio file using the actual audio_file_id
        const audioUrl = await uploadService.getAudioUrl(audioFileId);
        const audio = new Audio(audioUrl);
        audio.preload = 'metadata';

        const trackState: TrackState = {
          audio,
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          volume: 100,
          isMuted: false
        };

        audio.addEventListener('loadedmetadata', () => {
          setTracks(new Map([['main', { ...trackState, duration: audio.duration }]]));
        });

        audio.addEventListener('timeupdate', () => {
          setTracks(prev => new Map(prev.set('main', { ...prev.get('main')!, currentTime: audio.currentTime })));
        });

        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          setTracks(prev => new Map(prev.set('main', { ...prev.get('main')!, isPlaying: false })));
        });

        setTrackInfos([{ id: 'main', track_name: title, track_type: 'full' }]);

      } else {
        // Load stem group tracks
        const stemTracks = await uploadService.getStemGroupTracks(mp3ContentId);
        const newTracks = new Map<string, TrackState>();

        for (const trackInfo of stemTracks) {
          const audioUrl = await uploadService.getAudioUrl(trackInfo.audio_file_id, mp3ContentId);
          const audio = new Audio(audioUrl);
          audio.preload = 'metadata';

          const trackState: TrackState = {
            audio,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            volume: trackInfo.volume,
            isMuted: trackInfo.is_muted
          };

          audio.addEventListener('loadedmetadata', () => {
            newTracks.set(trackInfo.id, { ...trackState, duration: audio.duration });
            setTracks(new Map(newTracks));
          });

          audio.addEventListener('timeupdate', () => {
            newTracks.set(trackInfo.id, { ...newTracks.get(trackInfo.id)!, currentTime: audio.currentTime });
            setTracks(new Map(newTracks));
          });

          audio.volume = trackInfo.volume / 100;
          audio.muted = trackInfo.is_muted;
        }

        setTrackInfos(stemTracks);
      }
    } catch (error) {
      console.error('Failed to load tracks:', error);
      onError?.(`Failed to load audio: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [contentType, mp3ContentId, uploadService]);

  useEffect(() => {
    loadTracks();

    // Cleanup when component unmounts or content changes
    return () => {
      tracks.forEach(track => {
        track.audio.pause();
        track.audio.src = '';
      });
    };
  }, [contentType, mp3ContentId]); // Only reload when content actually changes

  const handlePlayPause = useCallback(() => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);

    tracks.forEach((track, trackId) => {
      if (newIsPlaying) {
        track.audio.play().catch(error => {
          console.error(`Failed to play track ${trackId}:`, error);
          onError?.(`Failed to play audio: ${error}`);
        });
      } else {
        track.audio.pause();
      }

      setTracks(prev => new Map(prev.set(trackId, { ...track, isPlaying: newIsPlaying })));
    });
  }, [isPlaying, tracks, onError]);

  const handleSeek = useCallback((newTime: number) => {
    tracks.forEach((track, trackId) => {
      track.audio.currentTime = newTime;
      setTracks(prev => new Map(prev.set(trackId, { ...track, currentTime: newTime })));
    });
  }, [tracks]);

  const handleVolumeChange = useCallback((trackId: string, newVolume: number) => {
    const track = tracks.get(trackId);
    if (!track) return;

    track.audio.volume = (newVolume / 100) * (masterVolume / 100);
    setTracks(prev => new Map(prev.set(trackId, { ...track, volume: newVolume })));

    // Update database
    if (contentType === 'stem_group') {
      uploadService.updateTrackSettings(trackId, { volume: newVolume });
    }
  }, [tracks, masterVolume, contentType, uploadService]);

  const handleMuteToggle = useCallback((trackId: string) => {
    const track = tracks.get(trackId);
    if (!track) return;

    const newMuted = !track.isMuted;
    track.audio.muted = newMuted;
    setTracks(prev => new Map(prev.set(trackId, { ...track, isMuted: newMuted })));

    // Update database
    if (contentType === 'stem_group') {
      uploadService.updateTrackSettings(trackId, { is_muted: newMuted });
    }
  }, [tracks, contentType, uploadService]);

  const handleMasterVolumeChange = useCallback((newMasterVolume: number) => {
    setMasterVolume(newMasterVolume);

    // Apply master volume to all tracks
    tracks.forEach((track) => {
      track.audio.volume = (track.volume / 100) * (newMasterVolume / 100);
    });
  }, [tracks]);

  // Get main track for progress/duration display
  const mainTrack = tracks.values().next().value;
  const currentTime = mainTrack?.currentTime || 0;
  const duration = mainTrack?.duration || 0;

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="audio-player loading">
        <div className="player-header">
          <h3>🎵 {title}</h3>
          <p>Loading audio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="audio-player">
      <div className="player-header">
        <h3>🎵 {title}</h3>
        <span className="content-type-badge">
          {contentType === 'single_track' ? '📄 Single Track' : '🎛️ Multi-Track Stems'}
        </span>
      </div>

      {/* Main Controls */}
      <div className="main-controls">
        <button
          className="play-pause-btn"
          onClick={handlePlayPause}
          disabled={tracks.size === 0}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        <div className="time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <input
          type="range"
          className="seek-bar"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={(e) => handleSeek(Number(e.target.value))}
          disabled={tracks.size === 0}
        />
      </div>

      {/* Master Volume (for multi-track) */}
      {contentType === 'stem_group' && (
        <div className="master-volume">
          <label>🎚️ Master Volume</label>
          <input
            type="range"
            min={0}
            max={100}
            value={masterVolume}
            onChange={(e) => handleMasterVolumeChange(Number(e.target.value))}
          />
          <span>{masterVolume}%</span>
        </div>
      )}

      {/* Individual Track Controls (for multi-track) */}
      {contentType === 'stem_group' && (
        <div className="track-controls">
          <h4>Individual Track Controls</h4>
          {trackInfos.map((trackInfo) => {
            const track = tracks.get(trackInfo.id);
            return (
              <div key={trackInfo.id} className="track-control">
                <div className="track-info">
                  <span className="track-name">{trackInfo.track_name}</span>
                  <button
                    className={`mute-btn ${track?.isMuted ? 'muted' : ''}`}
                    onClick={() => handleMuteToggle(trackInfo.id)}
                  >
                    {track?.isMuted ? '🔇' : '🔊'}
                  </button>
                </div>
                <div className="track-volume">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={track?.volume || 0}
                    onChange={(e) => handleVolumeChange(trackInfo.id, Number(e.target.value))}
                  />
                  <span>{track?.volume || 0}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}