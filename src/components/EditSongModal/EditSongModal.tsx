import { useState, useEffect, useRef } from 'react';
import { Modal } from '../Modal/Modal';
import { SongRoutine } from '../../repositories/songRoutineRepository';
import './EditSongModal.css';

interface EditSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: SongRoutine | null;
  onSave: (updatedSong: SongRoutine) => void;
}

export function EditSongModal({ isOpen, onClose, song, onSave }: EditSongModalProps) {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [notes, setNotes] = useState('');
  const [freeformNotes, setFreeformNotes] = useState('');
  const [volume, setVolume] = useState(100);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (song) {
      setName(song.name || '');
      setTitle(song.title || '');
      setArtist(song.artist || '');
      setNotes(song.notes || '');
      setFreeformNotes(song.freeform_notes || '');
      setVolume(song.volume || 100);
      setTags([]); // TODO: Load tags from database
    }
  }, [song]);

  const handleSave = () => {
    if (!song) return;

    const updatedSong: SongRoutine = {
      ...song,
      name: name.trim(),
      title: title.trim(),
      artist: artist.trim(),
      notes: notes.trim(),
      freeform_notes: freeformNotes.trim(),
      volume: volume
    };

    onSave(updatedSong);
    onClose();
  };

  const addTag = (e?: React.KeyboardEvent | React.MouseEvent) => {
    e?.preventDefault();
    const tag = newTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
      setNewTag('');
      // Keep focus on the input after adding a tag
      setTimeout(() => tagInputRef.current?.focus(), 10);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    if (song) {
      setName(song.name || '');
      setTitle(song.title || '');
      setArtist(song.artist || '');
      setNotes(song.notes || '');
      setFreeformNotes(song.freeform_notes || '');
      setVolume(song.volume || 100);
      setTags([]);
    }
    setNewTag('');
  };

  if (!song) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" title="Edit Song">
      <div className="edit-song-modal">
        <div className="edit-song-header">
          <h2>✏️ Edit Song</h2>
        </div>

        <div className="edit-song-content">
          <div className="form-group">
            <label htmlFor="song-name">Song Name *</label>
            <input
              id="song-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="Enter song name (required)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="song-title">YouTube Title</label>
            <input
              id="song-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder="Enter video title"
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
            <label htmlFor="song-notes">Practice Notes</label>
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
            <label htmlFor="song-freeform-notes">Additional Notes</label>
            <textarea
              id="song-freeform-notes"
              value={freeformNotes}
              onChange={(e) => setFreeformNotes(e.target.value)}
              className="form-textarea"
              placeholder="Any other notes or observations"
              rows={2}
            />
          </div>

          <div className="form-group">
            <label htmlFor="song-volume">Volume ({volume}%)</label>
            <input
              id="song-volume"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="form-range"
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
                ref={tagInputRef}
                type="text"
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(e);
                  }
                }}
                className="tag-input"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck="false"
              />
              <button
                onClick={(e) => addTag(e)}
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
              <span className="info-label">Duration:</span>
              <span className="info-value">{Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Created:</span>
              <span className="info-value">{new Date(song.created_at).toLocaleDateString()}</span>
            </div>
            {song.last_practiced && (
              <div className="info-item">
                <span className="info-label">Last Practiced:</span>
                <span className="info-value">{new Date(song.last_practiced).toLocaleDateString()}</span>
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