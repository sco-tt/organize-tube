import { useState } from 'react';
import { Modal } from '../Modal/Modal';
import './SpeedControlModal.css';

interface SpeedControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
  allSpeedOptions: number[];
}

export function SpeedControlModal({
  isOpen,
  onClose,
  currentSpeed,
  onSpeedChange,
  allSpeedOptions,
}: SpeedControlModalProps) {
  const [customSpeed, setCustomSpeed] = useState<string>('');

  const handleSpeedSelect = (speed: number) => {
    onSpeedChange(speed);
    onClose();
  };

  const handleCustomSpeedSubmit = () => {
    const speed = parseFloat(customSpeed);
    if (!isNaN(speed) && speed > 0 && speed <= 5) {
      onSpeedChange(speed);
      setCustomSpeed('');
      onClose();
    } else {
      alert('Please enter a valid speed between 0.1 and 5.0');
    }
  };

  const speedPresets = [
    { label: 'Very Slow', speeds: [0.25, 0.5, 0.75] },
    { label: 'Normal Practice', speeds: [0.8, 0.9, 1.0] },
    { label: 'Fast Practice', speeds: [1.1, 1.25, 1.5] },
    { label: 'Performance', speeds: [1.75, 2.0] },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Speed Controls"
      size="md"
      className="speed-control-modal"
    >
      <div className="speed-modal-content">
        <div className="current-speed-display">
          <span className="current-label">Current Speed:</span>
          <span className="current-value">{currentSpeed}x</span>
        </div>

        <div className="speed-presets">
          {speedPresets.map((preset) => (
            <div key={preset.label} className="speed-preset-group">
              <h4 className="preset-label">{preset.label}</h4>
              <div className="preset-speeds">
                {preset.speeds.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedSelect(speed)}
                    className={`speed-option ${currentSpeed === speed ? 'active' : ''}`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="all-speeds-section">
          <h4>All Available Speeds</h4>
          <div className="all-speeds-grid">
            {allSpeedOptions.map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedSelect(speed)}
                className={`speed-option ${currentSpeed === speed ? 'active' : ''}`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <div className="custom-speed-section">
          <h4>Custom Speed</h4>
          <div className="custom-speed-input">
            <input
              type="number"
              placeholder="1.0"
              value={customSpeed}
              onChange={(e) => setCustomSpeed(e.target.value)}
              min="0.1"
              max="5.0"
              step="0.05"
              onKeyPress={(e) => e.key === 'Enter' && handleCustomSpeedSubmit()}
            />
            <button onClick={handleCustomSpeedSubmit} className="apply-custom-speed">
              Apply
            </button>
          </div>
          <p className="custom-speed-hint">
            Enter any speed between 0.1x and 5.0x (e.g., 0.33, 1.25, 2.5)
          </p>
        </div>

        <div className="speed-tips">
          <h4>💡 Practice Tips</h4>
          <ul>
            <li><strong>0.25x - 0.5x:</strong> Learn new material, focus on accuracy</li>
            <li><strong>0.75x - 0.9x:</strong> Build muscle memory and confidence</li>
            <li><strong>1.0x - 1.25x:</strong> Polish and prepare for performance</li>
            <li><strong>1.5x+:</strong> Challenge yourself and improve technique</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}