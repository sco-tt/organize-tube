import { useState } from 'react';
import { Modal } from '../Modal/Modal';
import { CSVExportService } from '../../services/csvExportService';
import { CSVImportService, ImportResult } from '../../services/csvImportService';
import './BackupImportModal.css';

interface BackupImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BackupImportModal({ isOpen, onClose }: BackupImportModalProps) {
  const [activeTab, setActiveTab] = useState<'backup' | 'import'>('backup');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExport = async (type: 'csv' | 'backup') => {
    try {
      setLoading(true);
      const exportService = new CSVExportService();

      if (type === 'csv') {
        await exportService.exportToFile();
        alert('CSV files exported successfully to Downloads folder!');
      } else {
        await exportService.exportBackup();
        alert('Backup file exported successfully to Downloads folder!');
      }
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    try {
      setLoading(true);
      const content = await importFile.text();
      const importService = new CSVImportService();

      let results: ImportResult;

      if (importFile.name.endsWith('.json')) {
        results = await importService.importBackupFromJSON(content);
      } else if (importFile.name.includes('songs')) {
        results = await importService.importSongsFromCSV(content);
      } else if (importFile.name.includes('segments')) {
        results = await importService.importSegmentsFromCSV(content);
      } else {
        // Default to songs import for generic CSV
        results = await importService.importSongsFromCSV(content);
      }

      setImportResults(results);
    } catch (error) {
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setImportResults(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title="Backup & Import">
      <div className="backup-import-modal">
        <div className="modal-header">
          <h2>💾 Backup & Import</h2>
        </div>

        <div className="tab-header">
          <button
            className={`tab-button ${activeTab === 'backup' ? 'active' : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            📤 Export/Backup
          </button>
          <button
            className={`tab-button ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            📥 Import
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'backup' && (
            <div className="backup-tab">
              <div className="backup-section">
                <h3>📊 Export as CSV</h3>
                <p>Export your data as separate CSV files (songs and segments).</p>
                <button
                  onClick={() => handleExport('csv')}
                  disabled={loading}
                  className="export-button csv-export"
                >
                  {loading ? '⏳ Exporting...' : '📊 Export CSV Files'}
                </button>
              </div>

              <div className="backup-section">
                <h3>💾 Full Backup</h3>
                <p>Create a complete backup as a JSON file (includes everything).</p>
                <button
                  onClick={() => handleExport('backup')}
                  disabled={loading}
                  className="export-button backup-export"
                >
                  {loading ? '⏳ Creating Backup...' : '💾 Create Full Backup'}
                </button>
              </div>

              <div className="backup-info">
                <h4>ℹ️ Export Information</h4>
                <ul>
                  <li><strong>CSV Export:</strong> Creates separate files for songs and segments</li>
                  <li><strong>Full Backup:</strong> Single JSON file with all data and relationships</li>
                  <li><strong>Location:</strong> Files are saved to your Downloads folder</li>
                  <li><strong>File Format:</strong> Timestamp is added to filenames</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="import-tab">
              <div className="import-section">
                <h3>📥 Import Data</h3>
                <p>Import songs and segments from CSV or JSON backup files.</p>

                <div className="file-input-section">
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="file-input"
                    id="import-file"
                  />
                  <label htmlFor="import-file" className="file-input-label">
                    📎 Choose File
                  </label>
                  {importFile && (
                    <div className="selected-file">
                      <span>📄 {importFile.name}</span>
                      <button onClick={resetImport} className="clear-file">✕</button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleImport}
                  disabled={!importFile || loading}
                  className="import-button"
                >
                  {loading ? '⏳ Importing...' : '📥 Import Data'}
                </button>
              </div>

              {importResults && (
                <div className="import-results">
                  <h4>📊 Import Results</h4>
                  <div className="results-summary">
                    <div className="result-item success">
                      <span className="result-icon">✅</span>
                      <span>Imported: {importResults.success}</span>
                    </div>
                    <div className="result-item skipped">
                      <span className="result-icon">⏭️</span>
                      <span>Skipped: {importResults.skipped}</span>
                    </div>
                    {importResults.errors.length > 0 && (
                      <div className="result-item errors">
                        <span className="result-icon">❌</span>
                        <span>Errors: {importResults.errors.length}</span>
                      </div>
                    )}
                  </div>

                  {importResults.errors.length > 0 && (
                    <details className="error-details">
                      <summary>View Error Details</summary>
                      <ul className="error-list">
                        {importResults.errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}

              <div className="import-info">
                <h4>ℹ️ Import Information</h4>
                <ul>
                  <li><strong>CSV Files:</strong> Automatically detected (songs vs segments)</li>
                  <li><strong>JSON Backups:</strong> Full restore of all data</li>
                  <li><strong>Duplicates:</strong> Existing items with same URL are skipped</li>
                  <li><strong>Validation:</strong> Invalid data is rejected with error messages</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}