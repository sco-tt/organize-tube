import { useState, useMemo } from 'react';
import { Modal } from '../Modal/Modal';
import { SongRoutine } from '../../repositories/songRoutineRepository';
import { useSavedSongs } from '../../hooks/useSavedSongs';
import { useCustomFields } from '../../hooks/useCustomFields';
import { parseUserSongData } from '../../utils/userSongData';
import './SetlistPrinterModal.css';

interface SetlistPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SetlistPrinterModal({ isOpen, onClose }: SetlistPrinterModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'tag'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  const { songs, loading } = useSavedSongs();
  const { fields: customFields } = useCustomFields();

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    songs.forEach(song => {
      try {
        const tags = JSON.parse(song.tags_json || '[]');
        tags.forEach((tag: string) => tagSet.add(tag));
      } catch (error) {
        // Invalid JSON, skip
      }
    });
    return Array.from(tagSet).sort();
  }, [songs]);

  // Filter songs based on selection
  const filteredSongs = useMemo(() => {
    if (selectedFilter === 'all') {
      return songs;
    } else {
      return songs.filter(song => {
        try {
          const tags = JSON.parse(song.tags_json || '[]');
          return tags.includes(selectedTag);
        } catch (error) {
          return false;
        }
      });
    }
  }, [songs, selectedFilter, selectedTag]);

  // Toggle song selection
  const toggleSong = (songId: string) => {
    const newSelection = new Set(selectedSongs);
    if (newSelection.has(songId)) {
      newSelection.delete(songId);
    } else {
      newSelection.add(songId);
    }
    setSelectedSongs(newSelection);
  };

  // Select all filtered songs
  const selectAll = () => {
    const allIds = new Set(filteredSongs.map(song => song.id));
    setSelectedSongs(allIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedSongs(new Set());
  };

  // Generate PDF content
  const generatePrintableContent = () => {
    const selectedSongList = filteredSongs.filter(song => selectedSongs.has(song.id));

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Setlist</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              font-size: 12pt;
              line-height: 1.4;
              margin: 0;
              padding: 20px;
              color: #000;
            }
            .setlist-header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .setlist-title {
              font-size: 18pt;
              font-weight: bold;
              margin: 0;
            }
            .setlist-date {
              font-size: 10pt;
              color: #666;
              margin: 5px 0 0 0;
            }
            .song-item {
              margin-bottom: 15px;
              page-break-inside: avoid;
              border-bottom: 1px solid #eee;
              padding-bottom: 8px;
            }
            .song-title {
              font-size: 14pt;
              font-weight: bold;
              margin: 0 0 2px 0;
            }
            .song-artist {
              font-size: 12pt;
              color: #666;
              margin: 0 0 4px 0;
            }
            .song-details {
              font-size: 10pt;
              color: #555;
            }
            .song-notes {
              font-size: 10pt;
              margin: 4px 0 0 0;
              font-style: italic;
            }
            .custom-field {
              font-size: 10pt;
              margin: 2px 0;
            }
            .custom-field-label {
              font-weight: bold;
            }
            .song-field {
              font-size: 10pt;
              margin: 3px 0;
              line-height: 1.4;
            }
            .song-field strong {
              color: #333;
              margin-right: 6px;
            }
            .tags {
              font-size: 9pt;
              color: #888;
              margin-top: 4px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="setlist-header">
            <h1 class="setlist-title">Setlist</h1>
            <p class="setlist-date">${new Date().toLocaleDateString()}</p>
          </div>

          ${selectedSongList.map((song, index) => {
            const customData = parseUserSongData(song.freeform_notes || '');
            const tags = JSON.parse(song.tags_json || '[]');

            // Build all non-empty fields
            let additionalFields = '';

            // URL and source
            if (song.url) {
              additionalFields += `<div class="song-field"><strong>URL:</strong> ${song.url}</div>`;
            }
            if (song.url_source && song.url_source !== 'youtube') {
              additionalFields += `<div class="song-field"><strong>Source:</strong> ${song.url_source}</div>`;
            }

            // Duration and Volume
            if (song.duration) {
              additionalFields += `<div class="song-field"><strong>Duration:</strong> ${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}</div>`;
            }
            if (song.volume && song.volume !== 100) {
              additionalFields += `<div class="song-field"><strong>Volume:</strong> ${song.volume}%</div>`;
            }

            // Notes
            if (song.notes) {
              additionalFields += `<div class="song-field"><strong>Notes:</strong> ${song.notes}</div>`;
            }
            if (song.freeform_notes && song.freeform_notes.trim()) {
              additionalFields += `<div class="song-field"><strong>Additional Notes:</strong> ${song.freeform_notes.replace(/\n/g, '<br>')}</div>`;
            }

            // Custom fields
            customFields.forEach(field => {
              const value = customData[field.name];
              if (value) {
                additionalFields += `<div class="song-field"><strong>${field.display_name}:</strong> ${value}</div>`;
              }
            });

            // Dates
            if (song.created_at) {
              additionalFields += `<div class="song-field"><strong>Created:</strong> ${new Date(song.created_at).toLocaleDateString()}</div>`;
            }
            if (song.last_practiced) {
              additionalFields += `<div class="song-field"><strong>Last Practiced:</strong> ${new Date(song.last_practiced).toLocaleDateString()}</div>`;
            }

            // Loops/Segments
            try {
              const loops = JSON.parse(song.loops_json || '[]');
              if (loops.length > 0) {
                additionalFields += `<div class="song-field"><strong>Segments:</strong> ${loops.map((loop: any) => loop.name || 'Unnamed').join(', ')}</div>`;
              }
            } catch (e) {
              // Invalid JSON, skip
            }

            // Practice steps
            try {
              const steps = JSON.parse(song.steps_json || '[]');
              if (steps.length > 0) {
                additionalFields += `<div class="song-field"><strong>Practice Steps:</strong> ${steps.length} step(s)</div>`;
              }
            } catch (e) {
              // Invalid JSON, skip
            }

            // Resource links
            try {
              const links = JSON.parse(song.links_json || '[]');
              if (links.length > 0) {
                additionalFields += `<div class="song-field"><strong>Resource Links:</strong> ${links.length} link(s)</div>`;
              }
            } catch (e) {
              // Invalid JSON, skip
            }

            return `
              <div class="song-item">
                <h2 class="song-title">${index + 1}. ${song.title || song.name || 'Untitled'}</h2>
                <p class="song-artist">by ${song.artist || 'Unknown Artist'}</p>

                ${additionalFields}

                ${tags.length > 0 ? `
                  <div class="tags">Tags: ${tags.join(', ')}</div>
                ` : ''}
              </div>
            `;
          }).join('')}

          <div style="margin-top: 30px; text-align: center; font-size: 10pt; color: #999;">
            Generated by Segment Studio • ${selectedSongList.length} songs
          </div>
        </body>
      </html>
    `;

    return printContent;
  };

  // Print/Generate PDF
  const handlePrint = async () => {
    console.log('Print button clicked, selectedSongs.size:', selectedSongs.size);

    if (selectedSongs.size === 0) {
      alert('Please select at least one song to print.');
      return;
    }

    setIsGenerating(true);

    try {
      console.log('Generating print content...');

      // Add small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));

      const printContent = generatePrintableContent();
      console.log('Print content generated, length:', printContent.length);

      // Create a data URL to bypass popup blockers
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(printContent)}`;

      // Try to open in new tab with data URL (less likely to be blocked)
      console.log('Opening data URL in new tab...');
      const printWindow = window.open(dataUrl, '_blank');

      if (!printWindow) {
        // Fallback: create downloadable HTML file
        console.log('New tab blocked, creating download link...');
        const blob = new Blob([printContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `setlist-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert('✅ Setlist downloaded! Check your Downloads folder for the HTML file. Open it and press Ctrl+P (Cmd+P) to print.');
      } else {
        console.log('Data URL opened successfully');
        alert('✅ Setlist opened in new tab! Press Ctrl+P (Cmd+P) to print it.');
      }
    } catch (error) {
      console.error('Error generating setlist:', error);
      alert(`❌ Error generating setlist: ${error.message || error}`);
    } finally {
      // Add delay before resetting to ensure user sees the generating state
      setTimeout(() => {
        setIsGenerating(false);
      }, 500);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Print Setlist">
      <div className="setlist-printer-modal">
        <div className="printer-header">
          <h2>📄 Generate Setlist</h2>
          <p>Create a printable setlist with song information and details.</p>
        </div>

        {/* Filter Options */}
        <div className="filter-section">
          <h3>Select Songs</h3>

          <div className="filter-options">
            <label className="filter-option">
              <input
                type="radio"
                value="all"
                checked={selectedFilter === 'all'}
                onChange={(e) => setSelectedFilter(e.target.value as 'all')}
              />
              <span>All Songs ({songs.length})</span>
            </label>

            <label className="filter-option">
              <input
                type="radio"
                value="tag"
                checked={selectedFilter === 'tag'}
                onChange={(e) => setSelectedFilter(e.target.value as 'tag')}
              />
              <span>Songs by Tag</span>
            </label>
          </div>

          {selectedFilter === 'tag' && (
            <div className="tag-selector">
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="tag-select"
              >
                <option value="">Select a tag...</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Song Selection */}
        {filteredSongs.length > 0 && (selectedFilter === 'all' || selectedTag) && (
          <div className="song-selection">
            <div className="selection-controls">
              <span className="selection-count">
                {selectedSongs.size} of {filteredSongs.length} songs selected
              </span>
              <div className="selection-actions">
                <button onClick={selectAll} className="select-all-btn">
                  Select All
                </button>
                <button onClick={clearSelection} className="clear-selection-btn">
                  Clear
                </button>
              </div>
            </div>

            <div className="song-list">
              {filteredSongs.map(song => (
                <label key={song.id} className="song-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedSongs.has(song.id)}
                    onChange={() => toggleSong(song.id)}
                  />
                  <div className="song-info">
                    <div className="song-title">{song.title || song.name || 'Untitled'}</div>
                    <div className="song-artist">{song.artist || 'Unknown Artist'}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="printer-actions">
          <button
            onClick={handlePrint}
            disabled={selectedSongs.size === 0 || isGenerating}
            className="print-btn"
          >
            {isGenerating ? '⏳ Generating...' : 'Print Setlist'}
          </button>
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}