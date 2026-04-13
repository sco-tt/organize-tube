import React, { useState } from 'react';
import { Modal } from '../Modal/Modal';
import { EditSongModal } from '../EditSongModal/EditSongModal';
import './MySongsModal.css';

interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
  segmentCount: number;
  lastPracticed?: string;
  createdAt: string;
  tags: string[];
}

interface MySongsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSongSelect: (songId: string, url: string) => void;
  savedSongs: Song[];
  onSongsUpdate: (songs: Song[]) => void;
}

export function MySongsModal({ isOpen, onClose, onSongSelect, savedSongs, onSongsUpdate }: MySongsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'artist' | 'created'>('recent');
  const [editingSong, setEditingSong] = useState<Song | null>(null);

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

  const filteredAndSortedSongs = savedSongs
    .filter(song =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          if (!a.lastPracticed && !b.lastPracticed) return 0;
          if (!a.lastPracticed) return 1;
          if (!b.lastPracticed) return -1;
          return new Date(b.lastPracticed).getTime() - new Date(a.lastPracticed).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'artist':
          return a.artist.localeCompare(b.artist);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  const handleSongSelect = (song: Song) => {
    onSongSelect(song.id, song.url);
    onClose();
  };

  const handleEdit = (song: Song) => {
    setEditingSong(song);
  };

  const handleSaveEdit = (updatedSong: Song) => {
    const updatedSongs = savedSongs.map(song =>
      song.id === updatedSong.id ? updatedSong : song
    );
    onSongsUpdate(updatedSongs);
    localStorage.setItem('organize-tube-songs', JSON.stringify(updatedSongs));
    setEditingSong(null);
  };

  const handleDelete = (songId: string) => {
    console.log('Delete function called with songId:', songId);

    // Simple test first
    alert(`Attempting to delete song with ID: ${songId}`);

    const songToDelete = savedSongs.find(song => song.id === songId);
    if (!songToDelete) {
      alert('Song not found!');
      return;
    }

    const songTitle = songToDelete.title;

    if (window.confirm(`Are you sure you want to delete "${songTitle}"?`)) {
      try {
        const updatedSongs = savedSongs.filter(song => song.id !== songId);
        console.log('Before update - songs count:', savedSongs.length);
        console.log('After update - songs count:', updatedSongs.length);

        // Update state
        onSongsUpdate(updatedSongs);

        // Update localStorage
        localStorage.setItem('organize-tube-songs', JSON.stringify(updatedSongs));

        alert('Song deleted successfully!');
      } catch (error) {
        console.error('Error deleting song:', error);
        alert('Error deleting song');
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="my-songs-modal">
        <div className="my-songs-header">
          <h2>📂 My Songs</h2>
          <div className="songs-count">
            {filteredAndSortedSongs.length} song{filteredAndSortedSongs.length !== 1 ? 's' : ''}
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
          {filteredAndSortedSongs.length === 0 ? (
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
                    <h3 className="song-title">{song.title}</h3>
                    <p className="song-artist">{song.artist}</p>
                  </div>

                  <div className="song-details">
                    <span className="song-duration">{formatDuration(song.duration)}</span>
                    <span className="song-segments">{song.segmentCount} segments</span>
                    {song.lastPracticed && (
                      <span className="song-last-practiced">
                        Practiced {formatDate(song.lastPracticed)}
                      </span>
                    )}
                  </div>

                  {song.tags.length > 0 && (
                    <div className="song-tags">
                      {song.tags.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
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