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
    if (tempStart !== null && tempEnd !== null && newLoopName.trim()) {
      if (tempEnd > tempStart) {
        onSaveLoop(newLoopName.trim(), tempStart, tempEnd);
        setTempStart(null);
        setTempEnd(null);
        setNewLoopName('');
        setShowSaveDialog(false);
      } else {
        alert('End time must be after start time');
      }
    }
  }, [tempStart, tempEnd, newLoopName, onSaveLoop]);

  const handleClearTemp = useCallback(() => {
    setTempStart(null);
    setTempEnd(null);
    setShowSaveDialog(false);
  }, []);

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
              <button onClick={() => setShowSaveDialog(true)} className="save-loop">
                💾 Save Loop
              </button>
              <button onClick={handleClearTemp} className="clear-temp">
                ❌ Clear
              </button>
            </div>
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
        <div className="saved-loops">
          <h4>Saved Loops</h4>
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
                    onClick={() => onSelectLoop(loop)}
                    className="select-loop"
                  >
                    {loop.id === activeLoop?.id ? '✅' : '▶️'}
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
              Clear Selection
            </button>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="loop-instructions">
        <p><strong>How to create loops:</strong></p>
        <ol>
          <li>Play video and pause at desired start point</li>
          <li>Click "📍 Set Start" to mark loop beginning</li>
          <li>Continue playing to desired end point</li>
          <li>Click "🏁 Set End" to mark loop end</li>
          <li>Save with a name for future use</li>
        </ol>
      </div>
    </div>
  );
}