import { useState, useMemo, useRef } from 'react';
import { Modal } from '../Modal/Modal';
import { EditSongModal } from '../EditSongModal/EditSongModal';
import { useSavedSongs } from '../../hooks/useSavedSongs';
import { SongRoutine } from '../../repositories/songRoutineRepository';
import { CSVImportService, ImportResult } from '../../services/csvImportService';
import './MySongsModal.css';

interface MySongsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSongSelect: (songId: string, url: string) => void;
}

export function MySongsModal({ isOpen, onClose, onSongSelect }: MySongsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'artist' | 'created'>('recent');
  const [editingSong, setEditingSong] = useState<SongRoutine | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    songs: savedSongs,
    loading,
    error,
    deleteSong,
    updateSong,
    markPracticed
  } = useSavedSongs();

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const filteredAndSortedSongs = useMemo(() => {
    return savedSongs
      .filter(song =>
        (song.title?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
        (song.artist?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
        (song.name?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
      )
      .sort((a, b) => {
        switch (sortBy) {
          case 'recent':
            if (!a.last_practiced && !b.last_practiced) return 0;
            if (!a.last_practiced) return 1;
            if (!b.last_practiced) return -1;
            return new Date(b.last_practiced).getTime() - new Date(a.last_practiced).getTime();
          case 'title':
            return (a.title || a.name).localeCompare(b.title || b.name);
          case 'artist':
            return (a.artist || '').localeCompare(b.artist || '');
          case 'created':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          default:
            return 0;
        }
      });
  }, [savedSongs, searchQuery, sortBy]);

  const handleSongSelect = (song: SongRoutine) => {
    onSongSelect(song.id, song.url);
    markPracticed(song.id).catch(console.error);
    onClose();
  };

  const handleEdit = (song: SongRoutine) => {
    setEditingSong(song);
  };

  const handleSaveEdit = async (updatedSong: SongRoutine) => {
    try {
      await updateSong(updatedSong.id, {
        name: updatedSong.name,
        title: updatedSong.title,
        artist: updatedSong.artist,
        notes: updatedSong.notes,
        freeform_notes: updatedSong.freeform_notes,
        volume: updatedSong.volume
      });
      setEditingSong(null);
    } catch (error) {
      console.error('Error saving song edit:', error);
      alert('Error saving changes');
    }
  };

  const handleDelete = async (songId: string) => {
    const songToDelete = savedSongs.find(song => song.id === songId);
    if (!songToDelete) {
      alert('Song not found!');
      return;
    }

    const songTitle = songToDelete.title || songToDelete.name;

    if (window.confirm(`Are you sure you want to delete "${songTitle}"?`)) {
      try {
        await deleteSong(songId);
      } catch (error) {
        console.error('Error deleting song:', error);
        alert('Error deleting song');
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const content = await file.text();
      const importService = new CSVImportService();

      let results: ImportResult;

      if (file.name.endsWith('.json')) {
        results = await importService.importBackupFromJSON(content);
      } else if (file.name.includes('songs') || file.name.endsWith('.csv')) {
        results = await importService.importSongsFromCSV(content);
      } else {
        // Default to songs import for generic CSV
        results = await importService.importSongsFromCSV(content);
      }


      // Show success message
      if (results.success > 0) {
        alert(`Import successful! ${results.success} songs imported, ${results.skipped} skipped.`);
        // The songs list will automatically update due to the useSavedSongs hook
      } else {
        alert('No songs were imported. Check file format or see error details.');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
      // Clear the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="My Songs">
      <div className="my-songs-modal">
        <div className="my-songs-header">
          <h2>📂 My Songs</h2>
          <div className="header-actions">
            <div className="songs-count">
              {filteredAndSortedSongs.length} song{filteredAndSortedSongs.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className="import-btn"
              title="Import songs from CSV or JSON file"
            >
              {isImporting ? '⏳ Importing...' : '📥 Import'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="my-songs-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search songs, artists, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="sort-controls">
            <label>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="sort-select"
            >
              <option value="recent">Last Practiced</option>
              <option value="title">Title</option>
              <option value="artist">Artist</option>
              <option value="created">Date Added</option>
            </select>
          </div>
        </div>

        <div className="songs-list">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner">⟳</div>
              <p>Loading songs...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h3>Error loading songs</h3>
              <p>{error}</p>
            </div>
          ) : filteredAndSortedSongs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎵</div>
              <h3>No songs found</h3>
              <p>
                {searchQuery ? 'Try a different search term' : 'Save your first song to get started!'}
              </p>
            </div>
          ) : (
            filteredAndSortedSongs.map((song) => (
              <div key={song.id} className="song-item">
                <div className="song-thumbnail">
                  <div className="thumbnail-placeholder">
                    🎵
                  </div>
                </div>

                <div className="song-info">
                  <div className="song-primary">
                    <h3 className="song-title">{song.title || song.name}</h3>
                    <p className="song-artist">{song.artist}</p>
                  </div>

                  <div className="song-details">
                    <span className="song-duration">{formatDuration(song.duration || 0)}</span>
                    <span className="song-volume">Vol: {song.volume}%</span>
                    {song.last_practiced && (
                      <span className="song-last-practiced">
                        Practiced {formatDate(song.last_practiced)}
                      </span>
                    )}
                  </div>

                  {/* TODO: Implement tags display with new SQLite structure */}
                </div>

                <div className="song-actions">
                  <button
                    onClick={() => handleSongSelect(song)}
                    className="action-btn primary"
                    title="Load and play this song"
                  >
                    ▶️ Load
                  </button>
                  <button
                    onClick={() => handleEdit(song)}
                    className="action-btn secondary"
                    title="Edit song details"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(song.id);
                    }}
                    className="action-btn danger"
                    title="Delete this song"
                    type="button"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredAndSortedSongs.length > 0 && (
          <div className="my-songs-footer">
            <p className="tip">
              💡 <strong>Tip:</strong> Click "Load" to open a song, or use tags to organize your collection
            </p>
          </div>
        )}
      </div>

      <EditSongModal
        isOpen={!!editingSong}
        onClose={() => setEditingSong(null)}
        song={editingSong}
        onSave={handleSaveEdit}
      />
    </Modal>
  );
}