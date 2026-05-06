import { useState } from 'react';
import { Modal } from '../Modal/Modal';
import { Metronome } from '../Metronome/Metronome';
import { DataExportService } from '../../services/dataExportService';
import './ToolsModal.css';

export interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ToolsModal({ isOpen, onClose }: ToolsModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');

  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    setExportStatus('Exporting data...');

    try {
      const exportService = DataExportService.getInstance();
      const filename = await exportService.quickExport(format);
      setExportStatus(`✅ Exported: ${filename}`);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('❌ Export failed');
    } finally {
      setIsExporting(false);
      // Clear status after 3 seconds
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Music Tools">
      <div className="tools-modal-content">
        <div className="tools-grid">
          <div className="tool-section">
            <Metronome />
          </div>

          {/* Data Export Tool */}
          <div className="tool-section">
            <div className="data-export-tool">
              <h4>💾 Data Export</h4>
              <p>Backup your songs, loops, and practice data</p>

              <div className="export-controls">
                <button
                  onClick={() => handleExport('json')}
                  disabled={isExporting}
                  className="export-btn json-btn"
                >
                  📄 Export JSON
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  disabled={isExporting}
                  className="export-btn csv-btn"
                >
                  📊 Export CSV
                </button>
              </div>

              {exportStatus && (
                <div className="export-status">
                  {exportStatus}
                </div>
              )}
            </div>
          </div>

          {/* Future tools can be added here */}
          <div className="tool-section placeholder">
            <div className="placeholder-tool">
              <h4>🎹 Piano</h4>
              <p>Virtual piano keyboard</p>
              <span className="coming-soon">Coming Soon</span>
            </div>
          </div>

          <div className="tool-section placeholder">
            <div className="placeholder-tool">
              <h4>🎸 Tuner</h4>
              <p>Guitar and instrument tuner</p>
              <span className="coming-soon">Coming Soon</span>
            </div>
          </div>

          <div className="tool-section placeholder">
            <div className="placeholder-tool">
              <h4>🎵 Scale Reference</h4>
              <p>Musical scales and modes</p>
              <span className="coming-soon">Coming Soon</span>
            </div>
          </div>
        </div>

        <div className="tools-footer">
          <p>More music practice tools will be added in future updates!</p>
        </div>
      </div>
    </Modal>
  );
}