import { useState, useCallback, useEffect } from 'react';
import { LoopSegment } from '../types/loops';
import { EditableTime } from './EditableTime';
import './LoopControls.css';

interface LoopControlsProps {
  currentTime: number;
  activeLoop: LoopSegment | null;
  loops: LoopSegment[];
  isLooping: boolean;
  tempStart: number | null;
  tempEnd: number | null;
  onSetLoopStart: (time: number) => void;
  onSetLoopEnd: (time: number) => void;
  onToggleLoop: () => void;
  onSelectLoop: (loop: LoopSegment | null) => void;
  onSaveLoop: (name: string, startTime: number, endTime: number) => void;
  onDeleteLoop: (loopId: string) => void;
  onClearTempPoints: () => void;
  onChangeTempStart?: (time: number) => void;
  onChangeTempEnd?: (time: number) => void;
}

export function LoopControls({
  currentTime,
  activeLoop,
  loops,
  isLooping,
  tempStart,
  tempEnd,
  onSetLoopStart,
  onSetLoopEnd,
  onToggleLoop,
  onSelectLoop,
  onSaveLoop,
  onDeleteLoop,
  onClearTempPoints,
  onChangeTempStart,
  onChangeTempEnd
}: LoopControlsProps) {
  const [newLoopName, setNewLoopName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Collapsible sections state
  const [isLoopSettingExpanded, setIsLoopSettingExpanded] = useState(true);
  const [isSavedLoopsExpanded, setIsSavedLoopsExpanded] = useState(false);
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false);

  // Auto-expand loops section when temp points are set or loops are saved
  useEffect(() => {
    if (tempStart !== null || tempEnd !== null) {
      setIsLoopSettingExpanded(true);
    }
  }, [tempStart, tempEnd]);

  // Auto-expand saved loops section when loops are added
  useEffect(() => {
    if (loops.length > 0) {
      setIsSavedLoopsExpanded(true);
    }
  }, [loops.length]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleSetStart = useCallback(() => {
    const time = Math.floor(currentTime * 100) / 100; // Round to centiseconds
    onSetLoopStart(time);
  }, [currentTime, onSetLoopStart]);

  const handleSetEnd = useCallback(() => {
    const time = Math.floor(currentTime * 100) / 100;
    onSetLoopEnd(time);
  }, [currentTime, onSetLoopEnd]);

  const handleSaveLoop = useCallback(() => {
    if (tempStart !== null && tempEnd !== null) {
      if (tempEnd > tempStart) {
        // Auto-generate name if none provided
        const name = newLoopName.trim() || `Segment ${tempStart.toFixed(0)}s-${tempEnd.toFixed(0)}s`;
        onSaveLoop(name, tempStart, tempEnd);
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
        const name = `Segment ${tempStart.toFixed(0)}s-${tempEnd.toFixed(0)}s`;
        onSaveLoop(name, tempStart, tempEnd);
        setNewLoopName('');
      } else {
        alert('End time must be after start time');
      }
    }
  }, [tempStart, tempEnd, onSaveLoop]);

  const handleClearTemp = useCallback(() => {
    onClearTempPoints();
    setShowSaveDialog(false);
  }, [onClearTempPoints]);

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
        <h3>🎯 Segments</h3>
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
          <span>⚙️ Loops</span>
          <span className={`expand-icon ${isLoopSettingExpanded ? 'expanded' : ''}`}>▼</span>
        </button>

        {isLoopSettingExpanded && (
          <div className="loop-setting">
            <div className="loop-buttons">
              <button onClick={handleSetStart} className="set-start">
                📍 Set Start
              </button>
              <button onClick={handleSetEnd} className="set-end">
                🏁 Set End
              </button>
            </div>

            {tempStart !== null && (
              <div className="temp-loop">
                <div className="temp-loop-badge">TEMPORARY</div>
                <div className="temp-loop-info">
                  <div className="temp-loop-times">
                    <div className="temp-time-row">
                      <span className="time-label">Start:</span>
                      <EditableTime
                        timeInSeconds={tempStart}
                        onTimeChange={onChangeTempStart || (() => {})}
                        className="time-value"
                      />
                    </div>
                    <div className="temp-time-row">
                      <span className="time-label">End:</span>
                      {tempEnd !== null ? (
                        <EditableTime
                          timeInSeconds={tempEnd}
                          onTimeChange={onChangeTempEnd || (() => {})}
                          className="time-value"
                        />
                      ) : (
                        <span className="time-value">--:--</span>
                      )}
                      {tempEnd !== null && (
                        <span className="temp-duration-inline">
                          <span className="duration-label">Duration:</span>
                          <span className="duration-value">{formatTime(tempEnd - tempStart)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  {tempEnd === null && (
                    <div className="temp-duration incomplete">
                      Set end point to complete
                    </div>
                  )}
                </div>
                <div className="temp-loop-actions">
                  {hasValidTempLoop ? (
                    <>
                      <div className="temp-action-row">
                        <button onClick={() => {
                          const tempLoop = { id: 'temp', name: 'Temp', startTime: tempStart!, endTime: tempEnd!, isActive: false };
                          handlePlayLoop(tempLoop);
                        }} className="temp-play">
                          ▶️
                        </button>
                        <button onClick={handleClearTemp} className="temp-delete">
                          🗑️
                        </button>
                      </div>
                      <div className="temp-action-row">
                        <button onClick={handleQuickSave} className="temp-save">
                          💾 Save
                        </button>
                        <button onClick={() => setShowSaveDialog(true)} className="temp-save-custom">
                          ✏️ Custom
                        </button>
                      </div>
                    </>
                  ) : (
                    <button onClick={handleClearTemp} className="clear-temp-single">
                      ✕ Clear Start
                    </button>
                  )}
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
                    <div className="saved-loop-badge">SAVED</div>
                    <div className="loop-details">
                      <span className="loop-name">{loop.name}</span>
                      <span className="loop-time">
                        {formatTime(loop.startTime)} → {formatTime(loop.endTime)}
                      </span>
                    </div>
                    <div className="loop-actions">
                      <button
                        onClick={() => onSelectLoop(loop)}
                        className="select-loop"
                        title="Select this segment"
                      >
                        ▶️
                      </button>
                      <button
                        onClick={() => handlePlayLoop(loop)}
                        className={`loop-toggle-btn ${activeLoop?.id === loop.id && isLooping ? 'active' : ''}`}
                        title={activeLoop?.id === loop.id && isLooping ? "Stop looping" : "Start looping"}
                      >
                        {activeLoop?.id === loop.id && isLooping ? '⏹️' : '🔁'}
                      </button>
                      <button
                        onClick={() => onDeleteLoop(loop.id)}
                        className="delete-loop"
                        title="Delete this segment"
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