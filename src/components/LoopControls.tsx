import { useState, useCallback } from 'react';
import { LoopSegment } from '../types/loops';
import './LoopControls.css';

interface LoopControlsProps {
  currentTime: number;
  activeLoop: LoopSegment | null;
  loops: LoopSegment[];
  isLooping: boolean;
  onSetLoopStart: (time: number) => void;
  onSetLoopEnd: (time: number) => void;
  onToggleLoop: () => void;
  onSelectLoop: (loop: LoopSegment | null) => void;
  onSaveLoop: (name: string, startTime: number, endTime: number) => void;
  onDeleteLoop: (loopId: string) => void;
}

export function LoopControls({
  currentTime,
  activeLoop,
  loops,
  isLooping,
  onSetLoopStart,
  onSetLoopEnd,
  onToggleLoop,
  onSelectLoop,
  onSaveLoop,
  onDeleteLoop
}: LoopControlsProps) {
  const [tempStart, setTempStart] = useState<number | null>(null);
  const [tempEnd, setTempEnd] = useState<number | null>(null);
  const [newLoopName, setNewLoopName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Collapsible sections state
  const [isLoopSettingExpanded, setIsLoopSettingExpanded] = useState(true);
  const [isSavedLoopsExpanded, setIsSavedLoopsExpanded] = useState(false);
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleSetStart = useCallback(() => {
    const time = Math.floor(currentTime * 100) / 100; // Round to centiseconds
    setTempStart(time);
    onSetLoopStart(time);
  }, [currentTime, onSetLoopStart]);

  const handleSetEnd = useCallback(() => {
    const time = Math.floor(currentTime * 100) / 100;
    setTempEnd(time);
    onSetLoopEnd(time);
  }, [currentTime, onSetLoopEnd]);

  const handleSaveLoop = useCallback(() => {
    if (tempStart !== null && tempEnd !== null) {
      if (tempEnd > tempStart) {
        // Auto-generate name if none provided
        const name = newLoopName.trim() || `Loop ${tempStart.toFixed(0)}s-${tempEnd.toFixed(0)}s`;
        onSaveLoop(name, tempStart, tempEnd);
        setTempStart(null);
        setTempEnd(null);
        setNewLoopName('');
        setShowSaveDialog(false);
      } else {
        alert('End time must be after start time');
      }
    }
  }, [tempStart, tempEnd, newLoopName, onSaveLoop]);

  const handleQuickSave = useCallback(() => {
    if (tempStart !== null && tempEnd !== null) {
      if (tempEnd > tempStart) {
        // Auto-save with generated name
        const name = `Loop ${tempStart.toFixed(0)}s-${tempEnd.toFixed(0)}s`;
        onSaveLoop(name, tempStart, tempEnd);
        setTempStart(null);
        setTempEnd(null);
        setNewLoopName('');
      } else {
        alert('End time must be after start time');
      }
    }
  }, [tempStart, tempEnd, onSaveLoop]);

  const handleClearTemp = useCallback(() => {
    setTempStart(null);
    setTempEnd(null);
    setShowSaveDialog(false);
  }, []);

  const handlePlayLoop = useCallback((loop: LoopSegment) => {
    // Select the loop
    onSelectLoop(loop);
    // If not already looping, start looping
    if (!isLooping) {
      onToggleLoop();
    }
  }, [onSelectLoop, onToggleLoop, isLooping]);

  const hasValidTempLoop = tempStart !== null && tempEnd !== null && tempEnd > tempStart;

  return (
    <div className="loop-controls">
      <div className="loop-header">
        <h3>🔁 Loop Controls</h3>
        <button
          onClick={onToggleLoop}
          className={`loop-toggle ${isLooping ? 'active' : ''}`}
        >
          {isLooping ? '⏹️ Stop Loop' : '🔄 Start Loop'}
        </button>
      </div>

      {/* Current Loop Info */}
      {activeLoop && (
        <div className="current-loop">
          <div className="loop-info">
            <strong>{activeLoop.name}</strong>
            <span>{formatTime(activeLoop.startTime)} → {formatTime(activeLoop.endTime)}</span>
          </div>
        </div>
      )}

      {/* Loop Point Setting */}
      <div className="collapsible-section">
        <button
          className="section-header"
          onClick={() => setIsLoopSettingExpanded(!isLoopSettingExpanded)}
        >
          <span>⚙️ Create Loop</span>
          <span className={`expand-icon ${isLoopSettingExpanded ? 'expanded' : ''}`}>▼</span>
        </button>

        {isLoopSettingExpanded && (
          <div className="loop-setting">
            <div className="time-display">
              Current: <strong>{formatTime(currentTime)}</strong>
            </div>

            <div className="loop-buttons">
              <button onClick={handleSetStart} className="set-start">
                📍 Set Start ({tempStart !== null ? formatTime(tempStart) : '--:--'})
              </button>
              <button onClick={handleSetEnd} className="set-end">
                🏁 Set End ({tempEnd !== null ? formatTime(tempEnd) : '--:--'})
              </button>
            </div>

            {hasValidTempLoop && (
              <div className="temp-loop">
                <div className="temp-loop-info">
                  <span>New Loop: {formatTime(tempStart!)} → {formatTime(tempEnd!)}</span>
                  <span>Duration: {formatTime(tempEnd! - tempStart!)}</span>
                </div>
                <div className="temp-loop-actions">
                  <button onClick={handleQuickSave} className="save-loop-quick">
                    💾 Save Loop
                  </button>
                  <button onClick={() => setShowSaveDialog(true)} className="save-loop-custom">
                    ✏️ Custom Name
                  </button>
                  <button onClick={handleClearTemp} className="clear-temp">
                    ❌ Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Loop Dialog */}
      {showSaveDialog && (
        <div className="save-dialog">
          <input
            type="text"
            placeholder="Loop name (e.g., 'Verse 1', 'Solo')"
            value={newLoopName}
            onChange={(e) => setNewLoopName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSaveLoop()}
          />
          <div className="dialog-buttons">
            <button onClick={handleSaveLoop}>Save</button>
            <button onClick={() => setShowSaveDialog(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Saved Loops List */}
      {loops.length > 0 && (
        <div className="collapsible-section">
          <button
            className="section-header"
            onClick={() => setIsSavedLoopsExpanded(!isSavedLoopsExpanded)}
          >
            <span>💾 Saved Loops ({loops.length})</span>
            <span className={`expand-icon ${isSavedLoopsExpanded ? 'expanded' : ''}`}>▼</span>
          </button>

          {isSavedLoopsExpanded && (
            <div className="saved-loops">
              <div className="loops-list">
                {loops.map((loop) => (
                  <div key={loop.id} className={`loop-item ${loop.id === activeLoop?.id ? 'active' : ''}`}>
                    <div className="loop-details">
                      <span className="loop-name">{loop.name}</span>
                      <span className="loop-time">
                        {formatTime(loop.startTime)} → {formatTime(loop.endTime)}
                      </span>
                    </div>
                    <div className="loop-actions">
                      <button
                        onClick={() => handlePlayLoop(loop)}
                        className="play-loop"
                        title="Play this loop"
                      >
                        ▶️
                      </button>
                      <button
                        onClick={() => onDeleteLoop(loop.id)}
                        className="delete-loop"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {activeLoop && (
                <button onClick={() => onSelectLoop(null)} className="clear-selection">
                  Exit Loop
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="collapsible-section">
        <button
          className="section-header"
          onClick={() => setIsInstructionsExpanded(!isInstructionsExpanded)}
        >
          <span>❓ How to Create Loops</span>
          <span className={`expand-icon ${isInstructionsExpanded ? 'expanded' : ''}`}>▼</span>
        </button>

        {isInstructionsExpanded && (
          <div className="loop-instructions">
            <ol>
              <li>Play video and pause at desired start point</li>
              <li>Click "📍 Set Start" to mark loop beginning</li>
              <li>Continue playing to desired end point</li>
              <li>Click "🏁 Set End" to mark loop end</li>
              <li>Save with a name for future use</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}