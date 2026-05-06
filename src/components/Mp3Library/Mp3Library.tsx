import { useState, useEffect, useCallback } from 'react';
import { AudioPlayer } from '../AudioPlayer/AudioPlayer';
import { Mp3UploadService } from '../../services/mp3UploadService';
import './Mp3Library.css';

interface Mp3Song {
  id: string;
  title: string;
  artist: string;
  content_type: 'single_track' | 'stem_group';
  mp3_content_id: string;
  created_at: string;
}

interface Mp3LibraryProps {
  onUploadClick: () => void;
  refreshTrigger?: number; // Prop to trigger refresh when new uploads happen
}

export function Mp3Library({ onUploadClick, refreshTrigger }: Mp3LibraryProps) {
  const [songs, setSongs] = useState<Mp3Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);

  const uploadService = Mp3UploadService.getInstance();

  const loadSongs = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const uploadedSongs = await uploadService.getUploadedSongs();
      setSongs(uploadedSongs);
    } catch (err) {
      console.error('Failed to load MP3 library:', err);
      setError(`Failed to load MP3 library: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [uploadService]);

  useEffect(() => {
    loadSongs();
  }, [loadSongs, refreshTrigger]);

  const handlePlayerError = useCallback((error: string) => {
    setError(`Player error: ${error}`);
  }, []);

  const handleSongSelect = useCallback((songId: string) => {
    setSelectedSongId(selectedSongId === songId ? null : songId);
  }, [selectedSongId]);

  const handleDeleteSong = useCallback(async (_songId: string) => {
    if (!confirm('Are you sure you want to delete this song?')) {
      return;
    }

    try {
      // Note: We'd need to implement a delete method in the upload service
      // For now, just refresh the list
      await loadSongs();
    } catch (err) {
      setError(`Failed to delete song: ${err}`);
    }
  }, [loadSongs]);

  if (isLoading) {
    return (
      <div className="mp3-library loading">
        <div className="library-header">
          <h2>🎵 MP3 Library</h2>
          <button className="upload-btn" onClick={onUploadClick}>
            📁 Upload MP3s
          </button>
        </div>
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <p>Loading your MP3 library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mp3-library error">
        <div className="library-header">
          <h2>🎵 MP3 Library</h2>
          <button className="upload-btn" onClick={onUploadClick}>
            📁 Upload MP3s
          </button>
        </div>
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={loadSongs} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="mp3-library empty">
        <div className="library-header">
          <h2>🎵 MP3 Library</h2>
          <button className="upload-btn" onClick={onUploadClick}>
            📁 Upload MP3s
          </button>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🎼</div>
          <h3>No MP3s uploaded yet</h3>
          <p>Upload your first MP3 file or multi-track stems to get started!</p>
          <button onClick={onUploadClick} className="empty-upload-btn">
            📁 Upload Your First MP3
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mp3-library">
      <div className="library-header">
        <h2>🎵 MP3 Library ({songs.length} song{songs.length !== 1 ? 's' : ''})</h2>
        <div className="header-actions">
          <button onClick={loadSongs} className="refresh-btn" title="Refresh library">
            🔄
          </button>
          <button className="upload-btn" onClick={onUploadClick}>
            📁 Upload MP3s
          </button>
        </div>
      </div>

      <div className="songs-list">
        {songs.map((song) => (
          <div key={song.id} className="song-item">
            <div className="song-header" onClick={() => handleSongSelect(song.id)}>
              <div className="song-info">
                <h3 className="song-title">{song.title}</h3>
                <p className="song-artist">{song.artist}</p>
                <div className="song-meta">
                  <span className={`content-type ${song.content_type}`}>
                    {song.content_type === 'single_track' ? '📄 Single Track' : '🎛️ Multi-Track Stems'}
                  </span>
                  <span className="upload-date">
                    Uploaded {new Date(song.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="song-actions">
                <button
                  className="play-toggle-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSongSelect(song.id);
                  }}
                >
                  {selectedSongId === song.id ? '🔽' : '▶️'}
                </button>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSong(song.id);
                  }}
                  title="Delete song"
                >
                  🗑️
                </button>
              </div>
            </div>

            {selectedSongId === song.id && (
              <div className="song-player">
                <AudioPlayer
                  title={song.title}
                  contentType={song.content_type}
                  mp3ContentId={song.mp3_content_id}
                  onError={handlePlayerError}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}