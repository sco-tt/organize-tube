import { useState, useEffect } from 'react';
import { Modal } from '../Modal/Modal';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Settings {
  loopPrecision: 'frame' | 'second';
  defaultPlaybackSpeeds: number[];
  defaultVolume: number;
  defaultVolumeOnlyForNewVideos: boolean;
  exportFormat: 'csv' | 'json' | 'both';
  importFormat: 'auto' | 'csv' | 'json';
}

const DEFAULT_SETTINGS: Settings = {
  loopPrecision: 'frame',
  defaultPlaybackSpeeds: [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0],
  defaultVolume: 100,
  defaultVolumeOnlyForNewVideos: false,
  exportFormat: 'both',
  importFormat: 'auto'
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [customSpeed, setCustomSpeed] = useState('');

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('segment-studio-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.warn('Failed to parse saved settings:', error);
      }
    }
  }, []);

  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('segment-studio-settings', JSON.stringify(newSettings));
  };

  const handleLoopPrecisionChange = (precision: 'frame' | 'second') => {
    saveSettings({ ...settings, loopPrecision: precision });
  };

  const handleExportFormatChange = (format: 'csv' | 'json' | 'both') => {
    saveSettings({ ...settings, exportFormat: format });
  };

  const handleImportFormatChange = (format: 'auto' | 'csv' | 'json') => {
    saveSettings({ ...settings, importFormat: format });
  };

  const handleDefaultVolumeChange = (volume: number) => {
    saveSettings({ ...settings, defaultVolume: Math.max(0, Math.min(100, volume)) });
  };

  const handleDefaultVolumeOnlyForNewVideosChange = (onlyForNew: boolean) => {
    saveSettings({ ...settings, defaultVolumeOnlyForNewVideos: onlyForNew });
  };

  const addCustomSpeed = () => {
    const speed = parseFloat(customSpeed);
    if (!isNaN(speed) && speed > 0 && speed <= 4 && !settings.defaultPlaybackSpeeds.includes(speed)) {
      const newSpeeds = [...settings.defaultPlaybackSpeeds, speed].sort((a, b) => a - b);
      saveSettings({ ...settings, defaultPlaybackSpeeds: newSpeeds });
      setCustomSpeed('');
    }
  };

  const removeSpeed = (speedToRemove: number) => {
    const newSpeeds = settings.defaultPlaybackSpeeds.filter(speed => speed !== speedToRemove);
    saveSettings({ ...settings, defaultPlaybackSpeeds: newSpeeds });
  };

  const resetToDefaults = () => {
    saveSettings(DEFAULT_SETTINGS);
    setCustomSpeed('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title="Settings">
      <div className="settings-modal">
        {/* Loop Precision Section */}
        <div className="settings-section">
          <h3>🎯 Loop Precision</h3>
          <p className="section-description">
            Choose how precise loop points should be when setting segments.
          </p>
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                name="loopPrecision"
                value="frame"
                checked={settings.loopPrecision === 'frame'}
                onChange={() => handleLoopPrecisionChange('frame')}
              />
              <span className="radio-label">
                <strong>Frame-level</strong> - Precise to ~33ms (recommended)
              </span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="loopPrecision"
                value="second"
                checked={settings.loopPrecision === 'second'}
                onChange={() => handleLoopPrecisionChange('second')}
              />
              <span className="radio-label">
                <strong>Second-level</strong> - Rounded to nearest second
              </span>
            </label>
          </div>
        </div>

        {/* Default Volume Section */}
        <div className="settings-section">
          <h3>🔊 Default Volume</h3>
          <p className="section-description">
            Set the default volume level for videos (0-100%).
          </p>
          <div className="volume-setting">
            <div className="volume-control-group">
              <input
                type="range"
                min="0"
                max="100"
                value={settings.defaultVolume}
                onChange={(e) => handleDefaultVolumeChange(Number(e.target.value))}
                className="volume-range"
              />
              <div className="volume-display">
                <span className="volume-value">{settings.defaultVolume}%</span>
              </div>
            </div>
            <div className="volume-presets">
              {[25, 50, 75, 100].map(preset => (
                <button
                  key={preset}
                  onClick={() => handleDefaultVolumeChange(preset)}
                  className={`volume-preset ${settings.defaultVolume === preset ? 'active' : ''}`}
                  type="button"
                >
                  {preset}%
                </button>
              ))}
            </div>
            <div className="volume-option">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={settings.defaultVolumeOnlyForNewVideos}
                  onChange={(e) => handleDefaultVolumeOnlyForNewVideosChange(e.target.checked)}
                />
                <span className="checkbox-label">
                  Only apply to new videos (preserve individual song volume settings)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Default Playback Speeds Section */}
        <div className="settings-section">
          <h3>⚡ Default Playback Speeds</h3>
          <p className="section-description">
            Customize the available playback speed options.
          </p>

          <div className="speed-list">
            {settings.defaultPlaybackSpeeds.map((speed) => (
              <div key={speed} className="speed-item">
                <span className="speed-value">{speed}x</span>
                <button
                  onClick={() => removeSpeed(speed)}
                  className="remove-speed"
                  title="Remove this speed"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="add-speed">
            <input
              type="number"
              placeholder="Add custom speed (0.1-4.0)"
              value={customSpeed}
              onChange={(e) => setCustomSpeed(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomSpeed()}
              min="0.1"
              max="4.0"
              step="0.05"
              className="speed-input"
            />
            <button
              onClick={addCustomSpeed}
              disabled={!customSpeed || isNaN(parseFloat(customSpeed))}
              className="add-speed-btn"
            >
              Add
            </button>
          </div>
        </div>

        {/* Export/Import Format Section */}
        <div className="settings-section">
          <h3>💾 Export/Import Formats</h3>
          <p className="section-description">
            Choose default formats for data export and import operations.
          </p>

          <div className="format-group">
            <div className="format-subsection">
              <h4>Export Format</h4>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="csv"
                    checked={settings.exportFormat === 'csv'}
                    onChange={() => handleExportFormatChange('csv')}
                  />
                  <span className="radio-label">CSV only</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="json"
                    checked={settings.exportFormat === 'json'}
                    onChange={() => handleExportFormatChange('json')}
                  />
                  <span className="radio-label">JSON only</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="both"
                    checked={settings.exportFormat === 'both'}
                    onChange={() => handleExportFormatChange('both')}
                  />
                  <span className="radio-label">Both formats (recommended)</span>
                </label>
              </div>
            </div>

            <div className="format-subsection">
              <h4>Import Format Detection</h4>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="importFormat"
                    value="auto"
                    checked={settings.importFormat === 'auto'}
                    onChange={() => handleImportFormatChange('auto')}
                  />
                  <span className="radio-label">Auto-detect (recommended)</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="importFormat"
                    value="csv"
                    checked={settings.importFormat === 'csv'}
                    onChange={() => handleImportFormatChange('csv')}
                  />
                  <span className="radio-label">Prefer CSV</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="importFormat"
                    value="json"
                    checked={settings.importFormat === 'json'}
                    onChange={() => handleImportFormatChange('json')}
                  />
                  <span className="radio-label">Prefer JSON</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Actions */}
        <div className="settings-actions">
          <button onClick={resetToDefaults} className="reset-btn">
            Reset to Defaults
          </button>
          <button onClick={onClose} className="close-btn">
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}