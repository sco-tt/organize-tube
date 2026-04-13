import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal/Modal';
import './EditSongModal.css';

interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  videoId: string;
  duration: number;
  segmentCount: number;
  segments: any[];
  lastPracticed?: string;
  createdAt: string;
  tags: string[];
  notes: string;
}

interface EditSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  onSave: (updatedSong: Song) => void;
}

export function EditSongModal({ isOpen, onClose, song, onSave }: EditSongModalProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (song) {
      setTitle(song.title);
      setArtist(song.artist);
      setNotes(song.notes || '');
      setTags(song.tags || []);
    }
  }, [song]);

  const handleSave = () => {
    if (!song) return;

    const updatedSong = {
      ...song,
      title: title.trim(),
      artist: artist.trim(),
      notes: notes.trim(),
      tags: tags
    };

    onSave(updatedSong);
    onClose();
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    if (song) {
      setTitle(song.title);
      setArtist(song.artist);
      setNotes(song.notes || '');
      setTags(song.tags || []);
    }
    setNewTag('');
  };

  if (!song) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="edit-song-modal">
        <div className="edit-song-header">
          <h2>✏️ Edit Song</h2>
        </div>

        <div className="edit-song-content">
          <div className="form-group">
            <label htmlFor="song-title">Song Title</label>
            <input
              id="song-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder="Enter song title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="song-artist">Artist</label>
            <input
              id="song-artist"
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="form-input"
              placeholder="Enter artist name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="song-notes">Notes</label>
            <textarea
              id="song-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-textarea"
              placeholder="Add practice notes, tips, etc."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tags-container">
              {tags.map((tag) => (
                <span key={tag} className="tag-item">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="tag-remove"
                    type="button"
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
              />
              <button
                onClick={addTag}
                disabled={!newTag.trim()}
                className="add-tag-btn"
                type="button"
              >
                Add
              </button>
            </div>
          </div>

          <div className="song-info">
            <div className="info-item">
              <span className="info-label">Segments:</span>
              <span className="info-value">{song.segmentCount}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Duration:</span>
              <span className="info-value">{Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Created:</span>
              <span className="info-value">{new Date(song.createdAt).toLocaleDateString()}</span>
            </div>
            {song.lastPracticed && (
              <div className="info-item">
                <span className="info-label">Last Practiced:</span>
                <span className="info-value">{new Date(song.lastPracticed).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="edit-song-footer">
          <button onClick={handleClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={!title.trim() || !artist.trim()}
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}