import { useState, useMemo, useRef, useEffect } from 'react';
import { Modal } from '../Modal/Modal';
import { EditSongModal } from '../EditSongModal/EditSongModal';
import { useSavedSongs } from '../../hooks/useSavedSongs';
import { useCustomFields } from '../../hooks/useCustomFields';
import { SongRoutine } from '../../repositories/songRoutineRepository';
import { CSVImportService, ImportResult } from '../../services/csvImportService';
import { parseUserSongData, formatUserSongDataForDisplay } from '../../utils/userSongData';
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
  const [showHeaderAnalysis, setShowHeaderAnalysis] = useState(false);
  const [csvAnalysis, setCsvAnalysis] = useState<any>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [acceptedMappings, setAcceptedMappings] = useState<Record<string, boolean>>({});
  const [unmappedColumnActions, setUnmappedColumnActions] = useState<Record<string, 'ignore' | string>>({});
  const [customFieldNames, setCustomFieldNames] = useState<Record<string, string>>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ songId: string; songTitle: string } | null>(null);
  const [fetchYouTubeTitles, setFetchYouTubeTitles] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    songs: savedSongs,
    loading,
    error,
    deleteSong,
    updateSong,
    markPracticed,
    refreshSongs
  } = useSavedSongs();

  const {
    fields: customFields,
    loading: customFieldsLoading
  } = useCustomFields();

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

  // Refresh songs list when modal opens
  useEffect(() => {
    if (isOpen) {
      refreshSongs();
    }
  }, [isOpen, refreshSongs]);

  const filteredAndSortedSongs = useMemo(() => {
    return savedSongs
      .filter(song =>
        (song.title?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
        (song.artist?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
        (song.title?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
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

  const handleDelete = (songId: string) => {
    console.log('MySongsModal.handleDelete: Called with songId:', songId);

    const songToDelete = savedSongs.find(song => song.id === songId);
    if (!songToDelete) {
      console.error('MySongsModal.handleDelete: Song not found for ID:', songId);
      alert('Song not found!');
      return;
    }

    const songTitle = songToDelete.title || songToDelete.name;
    console.log('MySongsModal.handleDelete: Found song to delete:', songTitle);

    // Show custom confirmation modal
    setDeleteConfirmation({ songId, songTitle });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    console.log('MySongsModal.confirmDelete: User confirmed deletion');
    try {
      console.log('MySongsModal.confirmDelete: Calling deleteSong...');
      await deleteSong(deleteConfirmation.songId);
      console.log('MySongsModal.confirmDelete: Delete completed successfully');
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('MySongsModal.confirmDelete: Error deleting song:', error);
      alert('Error deleting song');
    }
  };

  const cancelDelete = () => {
    console.log('MySongsModal.cancelDelete: User cancelled deletion');
    setDeleteConfirmation(null);
  };

  const handleImportClick = () => {
    console.log('handleImportClick: Import button clicked');
    console.log('handleImportClick: fileInputRef.current:', fileInputRef.current);
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileSelect: File selection started');
    const file = event.target.files?.[0];
    if (!file) {
      console.log('handleFileSelect: No file selected');
      return;
    }

    console.log('handleFileSelect: Selected file:', file.name, 'Type:', file.type, 'Size:', file.size);

    try {
      console.log('handleFileSelect: Reading file content...');
      const content = await file.text();
      console.log('handleFileSelect: File content length:', content.length);

      if (file.name.endsWith('.json')) {
        // JSON files import directly
        console.log('handleFileSelect: Processing as JSON file');
        await performImport(content, 'json');
      } else {
        // CSV files show analysis first
        console.log('handleFileSelect: Processing as CSV file');
        setCsvContent(content);
        const importService = new CSVImportService();

        console.log('handleFileSelect: Analyzing CSV headers with custom fields:', customFields.length);
        const analysis = await importService.analyzeCsvHeaders(content, customFields);
        console.log('handleFileSelect: CSV analysis completed:', analysis);
        setCsvAnalysis(analysis);

        // Initialize accepted mappings (all auto-detected mappings accepted by default)
        const initialAccepted: Record<string, boolean> = {};
        Object.keys(analysis.suggestedMappings).forEach(csvHeader => {
          initialAccepted[csvHeader] = true;
        });
        setAcceptedMappings(initialAccepted);

        // Initialize unmapped column actions (all set to ignore by default)
        const initialUnmappedActions: Record<string, 'ignore' | string> = {};
        analysis.unmappedColumns.forEach((column: string) => {
          initialUnmappedActions[column] = 'ignore';
        });
        setUnmappedColumnActions(initialUnmappedActions);

        console.log('handleFileSelect: Showing header analysis modal');
        setShowHeaderAnalysis(true);
      }
    } catch (error) {
      console.error('handleFileSelect: File processing error:', error);
      alert(`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const toggleMapping = (csvHeader: string) => {
    setAcceptedMappings(prev => ({
      ...prev,
      [csvHeader]: !prev[csvHeader]
    }));
  };

  const setUnmappedColumnAction = (column: string, action: 'ignore' | string) => {
    setUnmappedColumnActions(prev => ({
      ...prev,
      [column]: action
    }));

    // Auto-fill custom field name with CSV column name when "create_new" is selected
    if (action === 'create_new') {
      setCustomFieldNames(prev => ({
        ...prev,
        [column]: column.replace(/[^a-zA-Z0-9\s]/g, ' ').trim() // Clean up the column name
      }));
    }
  };

  const setCustomFieldName = (column: string, fieldName: string) => {
    setCustomFieldNames(prev => ({
      ...prev,
      [column]: fieldName
    }));
  };

  const performImport = async (content: string, type: 'csv' | 'json') => {
    console.log('performImport: Starting import, type:', type);
    setIsImporting(true);

    try {
      const importService = new CSVImportService();
      let results: ImportResult;

      if (type === 'json') {
        console.log('performImport: Importing JSON');
        results = await importService.importBackupFromJSON(content);
      } else {
        // Combine accepted auto-detected mappings with manual unmapped column mappings
        console.log('performImport: Processing CSV mappings...');
        const finalMappings: Record<string, string> = {};

        // Add accepted auto-detected mappings
        console.log('performImport: csvAnalysis.suggestedMappings:', csvAnalysis?.suggestedMappings);
        console.log('performImport: acceptedMappings:', acceptedMappings);
        Object.entries(csvAnalysis?.suggestedMappings || {}).forEach(([csvHeader, songField]) => {
          if (acceptedMappings[csvHeader]) {
            console.log(`performImport: Adding auto-mapping: ${csvHeader} → ${songField}`);
            finalMappings[csvHeader] = songField as string;
          }
        });

        // Add manually mapped unmapped columns
        console.log('performImport: unmappedColumnActions:', unmappedColumnActions);
        Object.entries(unmappedColumnActions).forEach(([csvHeader, action]) => {
          if (action === 'create_new') {
            // Use the custom field name if provided
            const customName = customFieldNames[csvHeader]?.trim();
            if (customName) {
              console.log(`performImport: Adding custom field: ${csvHeader} → custom:${customName}`);
              finalMappings[csvHeader] = `custom:${customName}`;
            }
          } else if (action !== 'ignore') {
            console.log(`performImport: Adding manual mapping: ${csvHeader} → ${action}`);
            finalMappings[csvHeader] = action;
          }
        });

        console.log('performImport: Final mappings:', finalMappings);
        console.log('performImport: fetchYouTubeTitles:', fetchYouTubeTitles);

        console.log('performImport: Calling importSongsFromCSVWithMappings...');
        results = await importService.importSongsFromCSVWithMappings(content, finalMappings, {
          fetchYouTubeTitles
        });
        console.log('performImport: Import completed, results:', results);
      }

      // Show success message
      console.log('performImport: Results received:', results);
      if (results.success > 0) {
        console.log('performImport: Import successful, refreshing songs...');
        alert(`Import successful! ${results.success} songs imported, ${results.skipped} skipped.`);
        // Refresh the songs list to show new imports
        await refreshSongs();
        console.log('performImport: Songs refreshed');
      } else {
        console.log('performImport: No songs imported');
        console.log('performImport: Import errors:', results.errors);
        alert('No songs were imported. Check file format or see error details.');
      }

      // Close analysis view
      console.log('performImport: Closing analysis view');
      setShowHeaderAnalysis(false);
      setCsvAnalysis(null);
      setCsvContent('');
    } catch (error) {
      console.error('performImport: Import error:', error);
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('performImport: Cleanup');
      setIsImporting(false);
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
                    <h3 className="song-title">{song.title}</h3>
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

      {showHeaderAnalysis && csvAnalysis && (() => {
        // Compute which columns should appear in each section
        const acceptedAutoMappings = Object.entries(csvAnalysis.suggestedMappings).filter(
          ([csvHeader]) => acceptedMappings[csvHeader]
        );
        const rejectedAutoMappings = Object.entries(csvAnalysis.suggestedMappings).filter(
          ([csvHeader]) => acceptedMappings[csvHeader] === false
        );
        const allUnmappedColumns = [
          ...csvAnalysis.unmappedColumns,
          ...rejectedAutoMappings.map(([csvHeader]) => csvHeader)
        ];

        return (
          <div className="header-analysis-overlay">
            <div className="header-analysis-modal">
              <h3>📊 CSV Header Analysis</h3>
              <div className="analysis-content">
                {acceptedAutoMappings.length > 0 && (
                  <div className="detected-mappings">
                    <h4>🎯 Auto-detected Mappings</h4>
                    <p className="mappings-hint">✅ Check the mappings you want to use for import:</p>
                    {acceptedAutoMappings.map(([csvHeader, songField]) => (
                      <div key={csvHeader} className="mapping-item accepted">
                        <label className="mapping-checkbox">
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => toggleMapping(csvHeader)}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <span className="csv-header">"{csvHeader}"</span>
                        <span className="arrow">→</span>
                        <span className="song-field">{songField}</span>
                        <span className="confidence">
                          ({Math.round((csvAnalysis.confidence[csvHeader] || 0) * 100)}% confidence)
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {allUnmappedColumns.length > 0 && (
                  <div className="unmapped-columns">
                    <h4>❓ Unmapped Columns</h4>
                    <p>Choose what to do with these columns:</p>
                    {allUnmappedColumns.map((header: string) => (
                      <div key={header} className="unmapped-column-item">
                        <span className="unmapped-header">"{header}"</span>
                        <select
                          value={unmappedColumnActions[header] || 'ignore'}
                          onChange={(e) => setUnmappedColumnAction(header, e.target.value)}
                          className="unmapped-action-select"
                        >
                          <option value="ignore">Ignore</option>
                          <optgroup label="Basic Song Info">
                            {!fetchYouTubeTitles && <option value="name">Name</option>}
                            {!fetchYouTubeTitles && <option value="title">Title</option>}
                            <option value="artist">Artist</option>
                            <option value="url">YouTube URL</option>
                            <option value="duration">Duration</option>
                            <option value="volume">Volume</option>
                            <option value="notes">Notes</option>
                          </optgroup>
                          {customFields.length > 0 && (
                            <optgroup label="Custom Fields">
                              {customFields.map(field => (
                                <option key={field.id} value={field.name}>
                                  {field.display_name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          <option value="create_new">🆕 Create New Field</option>
                        </select>
                        {unmappedColumnActions[header] === 'create_new' && (
                          <input
                            type="text"
                            placeholder="New field name..."
                            className="new-field-input"
                            value={customFieldNames[header] || ''}
                            onChange={(e) => setCustomFieldName(header, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="preview-summary">
                  <p><strong>Found {csvAnalysis.detectedHeaders.length} columns total</strong></p>
                  <p>✅ {acceptedAutoMappings.length} auto-detected mappings</p>
                  <p>🎯 {Object.values(unmappedColumnActions).filter(action => action !== 'ignore' && action !== 'create_new').length} manually mapped</p>
                  <p>🆕 {Object.entries(unmappedColumnActions).filter(([header, action]) => action === 'create_new' && customFieldNames[header]?.trim()).length} new custom fields</p>
                  <p>⏭️ {Object.values(unmappedColumnActions).filter(action => action === 'ignore').length + rejectedAutoMappings.length} ignored columns</p>

                  <div className="youtube-fetch-option">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={fetchYouTubeTitles}
                        onChange={(e) => setFetchYouTubeTitles(e.target.checked)}
                      />
                      🎥 Fetch video titles from YouTube API (recommended)
                    </label>
                    <p className="option-description">
                      {fetchYouTubeTitles
                        ? "✨ Song names and titles will be auto-generated from YouTube video titles."
                        : "Manually map your song name and title columns from the CSV data."
                      }
                    </p>
                  </div>
                </div>
            </div>

            <div className="analysis-actions">
              <button
                onClick={() => setShowHeaderAnalysis(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={() => performImport(csvContent, 'csv')}
                disabled={isImporting}
                className="import-btn primary"
              >
                {isImporting ? 'Importing...' : 'Import with These Mappings'}
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {deleteConfirmation && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-modal">
            <h3>🗑️ Delete Song</h3>
            <p>Are you sure you want to delete <strong>"{deleteConfirmation.songTitle}"</strong>?</p>
            <p className="warning">This action cannot be undone.</p>
            <div className="confirmation-actions">
              <button onClick={cancelDelete} className="cancel-btn">
                Cancel
              </button>
              <button onClick={confirmDelete} className="delete-confirm-btn">
                Delete Song
              </button>
            </div>
          </div>
        </div>
      )}

      <EditSongModal
        isOpen={!!editingSong}
        onClose={() => setEditingSong(null)}
        song={editingSong}
        onSave={handleSaveEdit}
      />
    </Modal>
  );
}