import { useState, useEffect } from 'react';
import { SongRoutine } from '../../repositories/songRoutineRepository';
import { useCustomFields } from '../../hooks/useCustomFields';
import { parseUserSongData, stringifyUserSongData, UserSongData } from '../../utils/userSongData';
import './SongInfoPanel.css';

interface SongInfoPanelProps {
  song: SongRoutine | null;
  onSongUpdate: (updatedSong: SongRoutine) => void;
}

export function SongInfoPanel({ song, onSongUpdate }: SongInfoPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [notes, setNotes] = useState('');
  const [volume, setVolume] = useState(100);
  const [customFieldValues, setCustomFieldValues] = useState<UserSongData>({});

  const { fields: customFields, loading: customFieldsLoading } = useCustomFields();

  useEffect(() => {
    if (song) {
      setTitle(song.title || '');
      setArtist(song.artist || '');
      setNotes(song.notes || '');
      setVolume(song.volume || 100);

      // Parse custom field values from freeform_notes
      const parsedCustomFields = parseUserSongData(song.freeform_notes || '');
      setCustomFieldValues(parsedCustomFields);
    } else {
      // Clear when no song
      setTitle('');
      setArtist('');
      setNotes('');
      setVolume(100);
      setCustomFieldValues({});
    }
  }, [song]);

  const updateCustomField = (fieldName: string, value: string | number) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSave = () => {
    if (!song) return;

    // Convert custom field values back to JSON for freeform_notes
    let finalFreeformNotes = '';
    if (Object.keys(customFieldValues).length > 0) {
      // Filter out empty values
      const nonEmptyCustomFields = Object.fromEntries(
        Object.entries(customFieldValues).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );
      if (Object.keys(nonEmptyCustomFields).length > 0) {
        finalFreeformNotes = stringifyUserSongData(nonEmptyCustomFields);
      }
    }

    const updatedSong: SongRoutine = {
      ...song,
      title: title.trim(),
      artist: artist.trim(),
      notes: notes.trim(),
      freeform_notes: finalFreeformNotes,
      volume: volume
    };

    onSongUpdate(updatedSong);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset to original values
    if (song) {
      setTitle(song.title || '');
      setArtist(song.artist || '');
      setNotes(song.notes || '');
      setVolume(song.volume || 100);
      const parsedCustomFields = parseUserSongData(song.freeform_notes || '');
      setCustomFieldValues(parsedCustomFields);
    }
    setIsEditing(false);
  };

  if (!song) {
    return null;
  }

  return (
    <div className="song-info-panel">
      <div className="song-info-header">
        <h3>📋 Song Information</h3>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="edit-btn">
            ✏️ Edit
          </button>
        ) : (
          <div className="edit-actions">
            <button onClick={handleCancel} className="cancel-btn">
              Cancel
            </button>
            <button onClick={handleSave} className="save-btn">
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="song-info-content">
        {!isEditing ? (
          // Display Mode
          <div className="song-info-display">
            <div className="info-row">
              <span className="info-label">Title:</span>
              <span className="info-value">{title || 'No title'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Artist:</span>
              <span className="info-value">{artist || 'No artist'}</span>
            </div>
            {notes && (
              <div className="info-row">
                <span className="info-label">Practice Notes:</span>
                <span className="info-value">{notes}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Volume:</span>
              <span className="info-value">{volume}%</span>
            </div>

            {/* Custom Fields Display */}
            {song?.freeform_notes && (() => {
              try {
                const customData = JSON.parse(song.freeform_notes);
                const formatLabel = (key: string) => {
                  return key
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());
                };

                return (
                  <div className="custom-fields-display">
                    {Object.entries(customData).map(([key, value]) => (
                      <div key={key} className="info-row">
                        <span className="info-label">{formatLabel(key)}:</span>
                        <span className="info-value">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                );
              } catch (error) {
                return null;
              }
            })()}
          </div>
        ) : (
          // Edit Mode
          <div className="song-info-edit">
            <div className="form-group">
              <label htmlFor="info-title">YouTube Title</label>
              <input
                id="info-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                placeholder="Enter video title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="info-artist">Artist</label>
              <input
                id="info-artist"
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="form-input"
                placeholder="Enter artist name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="info-notes">Practice Notes</label>
              <textarea
                id="info-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-textarea"
                placeholder="Add practice notes, tips, etc."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="info-volume">Volume ({volume}%)</label>
              <input
                id="info-volume"
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="form-range"
              />
            </div>

            {/* Dynamic Custom Fields */}
            {!customFieldsLoading && customFields.length > 0 && (
              <div className="custom-fields-section">
                <h4 className="custom-fields-title">Custom Fields</h4>
                {customFields
                  .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                  .map((field) => {
                    const fieldValue = customFieldValues[field.name] || field.default_value || '';

                    return (
                      <div key={field.id} className="form-group">
                        <label htmlFor={`info-custom-field-${field.id}`}>
                          {field.display_name}
                          {field.is_required && <span className="required">*</span>}
                        </label>

                        {field.field_type === 'text' && (
                          <input
                            id={`info-custom-field-${field.id}`}
                            type="text"
                            value={String(fieldValue)}
                            onChange={(e) => updateCustomField(field.name, e.target.value)}
                            className="form-input"
                            placeholder={`Enter ${field.display_name.toLowerCase()}`}
                            required={field.is_required}
                          />
                        )}

                        {field.field_type === 'number' && (
                          <input
                            id={`info-custom-field-${field.id}`}
                            type="number"
                            value={String(fieldValue)}
                            onChange={(e) => updateCustomField(field.name, e.target.value ? Number(e.target.value) : '')}
                            className="form-input"
                            placeholder={`Enter ${field.display_name.toLowerCase()}`}
                            required={field.is_required}
                          />
                        )}

                        {field.field_type === 'select' && field.field_options && (
                          <select
                            id={`info-custom-field-${field.id}`}
                            value={String(fieldValue)}
                            onChange={(e) => updateCustomField(field.name, e.target.value)}
                            className="form-input"
                            required={field.is_required}
                          >
                            <option value="">Choose {field.display_name.toLowerCase()}</option>
                            {field.field_options.split(',').map((option) => (
                              <option key={option.trim()} value={option.trim()}>
                                {option.trim()}
                              </option>
                            ))}
                          </select>
                        )}

                        {field.field_type === 'textarea' && (
                          <textarea
                            id={`info-custom-field-${field.id}`}
                            value={String(fieldValue)}
                            onChange={(e) => updateCustomField(field.name, e.target.value)}
                            className="form-textarea"
                            placeholder={`Enter ${field.display_name.toLowerCase()}`}
                            rows={3}
                            required={field.is_required}
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}