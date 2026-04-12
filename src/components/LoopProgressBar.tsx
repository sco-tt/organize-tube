import { useState, useCallback } from 'react';
import { LoopSegment } from '../types/loops';
import './LoopProgressBar.css';

interface LoopProgressBarProps {
  currentTime: number;
  duration: number;
  activeLoop: LoopSegment | null;
  onSeekToTime: (time: number) => void;
  onSetLoopStart?: (time: number) => void;
  onSetLoopEnd?: (time: number) => void;
}

export function LoopProgressBar({
  currentTime,
  duration,
  activeLoop,
  onSeekToTime,
  onSetLoopStart,
  onSetLoopEnd
}: LoopProgressBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'seek' | 'start' | 'end'>('seek');
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeFromPosition = useCallback((e: React.MouseEvent<HTMLDivElement>, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    return percentage * duration;
  }, [duration]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;

    const time = getTimeFromPosition(e, e.currentTarget);

    // Determine drag mode based on modifiers
    if (e.shiftKey && onSetLoopStart) {
      setDragMode('start');
      onSetLoopStart(time);
    } else if (e.ctrlKey && onSetLoopEnd) {
      setDragMode('end');
      onSetLoopEnd(time);
    } else {
      setDragMode('seek');
      onSeekToTime(time);
    }

    setIsDragging(true);
  }, [duration, getTimeFromPosition, onSeekToTime, onSetLoopStart, onSetLoopEnd]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !duration) return;

    const time = getTimeFromPosition(e, e.currentTarget);

    if (dragMode === 'start' && onSetLoopStart) {
      onSetLoopStart(time);
    } else if (dragMode === 'end' && onSetLoopEnd) {
      onSetLoopEnd(time);
    } else if (dragMode === 'seek') {
      onSeekToTime(time);
    }
  }, [isDragging, duration, dragMode, getTimeFromPosition, onSeekToTime, onSetLoopStart, onSetLoopEnd]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragMode('seek');
  }, []);

  const overallProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

  let loopProgress = 0;
  let loopStartPercent = 0;
  let loopWidthPercent = 0;

  if (activeLoop && duration > 0) {
    const loopDuration = activeLoop.endTime - activeLoop.startTime;
    const timeInLoop = Math.max(0, Math.min(loopDuration, currentTime - activeLoop.startTime));
    loopProgress = loopDuration > 0 ? (timeInLoop / loopDuration) * 100 : 0;

    loopStartPercent = (activeLoop.startTime / duration) * 100;
    loopWidthPercent = (loopDuration / duration) * 100;
  }

  return (
    <div className="loop-progress-container">
      {/* Main timeline */}
      <div
        className={`main-progress-bar ${isDragging ? 'dragging' : ''} ${dragMode}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Loop region indicator */}
        {activeLoop && (
          <div
            className="loop-region"
            style={{
              left: `${loopStartPercent}%`,
              width: `${loopWidthPercent}%`
            }}
          />
        )}

        {/* Overall progress */}
        <div
          className="overall-progress"
          style={{ width: `${Math.min(100, overallProgress)}%` }}
        />

        {/* Current position indicator */}
        <div
          className="current-position"
          style={{ left: `${Math.min(100, overallProgress)}%` }}
        />
      </div>

      {/* Time displays */}
      <div className="time-info">
        <span className="current-time">{formatTime(currentTime)}</span>
        {activeLoop && (
          <span className="loop-info">
            Loop: {activeLoop.name} ({formatTime(activeLoop.startTime)} - {formatTime(activeLoop.endTime)})
          </span>
        )}
        <span className="total-time">{formatTime(duration)}</span>
      </div>

      {/* Drag instructions */}
      {(onSetLoopStart || onSetLoopEnd) && (
        <div className="drag-instructions">
          <small>
            💡 Drag to seek • Shift+drag to set start • Ctrl+drag to set end
          </small>
        </div>
      )}

      {/* Loop-specific progress bar */}
      {activeLoop && (
        <div className="loop-progress">
          <div className="loop-progress-label">Loop Progress:</div>
          <div className="loop-progress-bar">
            <div
              className="loop-progress-fill"
              style={{ width: `${Math.min(100, loopProgress)}%` }}
            />
          </div>
          <div className="loop-progress-text">
            {Math.round(loopProgress)}% ({formatTime(Math.max(0, currentTime - activeLoop.startTime))} / {formatTime(activeLoop.endTime - activeLoop.startTime)})
          </div>
        </div>
      )}
    </div>
  );
}