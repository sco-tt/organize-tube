import { LoopSegment } from '../types/loops';
import './LoopProgressBar.css';

interface LoopProgressBarProps {
  currentTime: number;
  duration: number;
  activeLoop: LoopSegment | null;
  onSeekToTime: (time: number) => void;
}

export function LoopProgressBar({
  currentTime,
  duration,
  activeLoop,
  onSeekToTime
}: LoopProgressBarProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const seekTime = percentage * duration;

    onSeekToTime(seekTime);
  };

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
      <div className="main-progress-bar" onClick={handleBarClick}>
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