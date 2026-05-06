import { useState, useCallback } from 'react';
import { Modal } from '../Modal/Modal';
import { Mp3UploadService } from '../../services/mp3UploadService';
import './Mp3UploadModal.css';

interface Mp3UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (routineId: string) => void;
}

interface FileInfo {
  path: string;
  name: string;
  trackName: string;
}

export function Mp3UploadModal({ isOpen, onClose, onUploadComplete }: Mp3UploadModalProps) {
  const [isMultiTrack, setIsMultiTrack] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const uploadService = Mp3UploadService.getInstance();

  const handleClose = useCallback(() => {
    if (!isUploading) {
      setSelectedFiles([]);
      setProjectName('');
      setIsMultiTrack(false);
      setUploadStatus('');
      onClose();
    }
  }, [isUploading, onClose]);

  const handleFileSelect = useCallback(async () => {
    try {
      setUploadStatus('📁 Opening file dialog...');
      const filePaths = await uploadService.selectAudioFiles(isMultiTrack);
      if (filePaths.length > 0) {
        const fileInfos: FileInfo[] = filePaths.map(path => {
          const fileName = path.split(/[/\\]/).pop() || path; // Handle both / and \ path separators
          const trackName = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
          return {
            path,
            name: fileName,
            trackName
          };
        });
        setSelectedFiles(fileInfos);
        setUploadStatus('');
      } else {
        setUploadStatus('');
      }
    } catch (error) {
      console.error('Failed to select files:', error);
      setUploadStatus(`❌ Failed to select files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [isMultiTrack, uploadService]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ['mp3', 'm4a', 'wav', 'ogg', 'flac'].includes(ext || '');
    });

    if (audioFiles.length === 0) {
      setUploadStatus('❌ No valid audio files found');
      return;
    }

    if (!isMultiTrack && audioFiles.length > 1) {
      setUploadStatus('❌ Multiple files selected but multi-track mode is disabled');
      return;
    }

    // In Tauri, we need to get the file path from the file object
    const fileInfos: FileInfo[] = audioFiles.map(file => {
      // Try to get the file path - in Tauri this should be available
      const filePath = (file as any).path || file.name;
      return {
        path: filePath,
        name: file.name,
        trackName: file.name.replace(/\.[^/.]+$/, '')
      };
    });

    setSelectedFiles(fileInfos);
    setUploadStatus('');
  }, [isMultiTrack]);

  const updateTrackName = useCallback((index: number, newName: string) => {
    setSelectedFiles(prev => prev.map((file, i) =>
      i === index ? { ...file, trackName: newName } : file
    ));
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      setUploadStatus('❌ No files selected');
      return;
    }

    if (isMultiTrack && !projectName.trim()) {
      setUploadStatus('❌ Project name is required for multi-track uploads');
      return;
    }

    setIsUploading(true);
    setUploadStatus('📤 Uploading files...');

    try {
      let routineId: string;

      if (isMultiTrack) {
        // Upload as stem group
        const filePaths = selectedFiles.map(f => f.path);
        const trackNames = selectedFiles.map(f => f.trackName);

        routineId = await uploadService.uploadStemGroup(projectName.trim(), filePaths, trackNames);
        setUploadStatus(`✅ Uploaded stem group "${projectName}" with ${selectedFiles.length} tracks!`);
      } else {
        // Upload single file
        const file = selectedFiles[0];
        routineId = await uploadService.uploadSingleFile(file.path, file.trackName);
        setUploadStatus(`✅ Uploaded "${file.trackName}" successfully!`);
      }

      // Wait a moment to show success message, then close and notify parent
      setTimeout(() => {
        onUploadComplete(routineId);
        handleClose();
      }, 1500);

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus(`❌ Upload failed: ${error}`);
      setIsUploading(false);
    }
  }, [selectedFiles, isMultiTrack, projectName, uploadService, onUploadComplete, handleClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="📁 Upload MP3 Files">
      <div className="mp3-upload-modal">
        {/* Multi-track toggle */}
        <div className="upload-mode-section">
          <label className="mode-checkbox">
            <input
              type="checkbox"
              checked={isMultiTrack}
              onChange={(e) => {
                setIsMultiTrack(e.target.checked);
                setSelectedFiles([]);
                setProjectName('');
              }}
              disabled={isUploading}
            />
            <span className="checkmark"></span>
            Upload multiple tracks (stems/parts)
          </label>
        </div>

        {/* Project name for multi-track */}
        {isMultiTrack && (
          <div className="project-name-section">
            <label htmlFor="project-name">Song/Project Name:</label>
            <input
              id="project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Hotel California"
              disabled={isUploading}
              className="project-name-input"
            />
          </div>
        )}

        {/* File drop zone */}
        <div
          className={`file-drop-zone ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!isUploading ? handleFileSelect : undefined}
        >
          <div className="drop-zone-content">
            {selectedFiles.length === 0 ? (
              <>
                <div className="drop-zone-icon">🎵</div>
                <h3>
                  {isMultiTrack
                    ? "Drop multiple MP3 files here"
                    : "Drop MP3 file here"
                  }
                </h3>
                <p>or click to browse</p>
                <div className="supported-formats">
                  Supported: MP3, M4A, WAV, OGG, FLAC
                </div>
              </>
            ) : (
              <div className="selected-files">
                <h3>📂 Selected Files ({selectedFiles.length})</h3>
                <div className="file-list">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-info">
                        <span className="file-icon">🎵</span>
                        <span className="file-name">{file.name}</span>
                      </div>
                      <input
                        type="text"
                        value={file.trackName}
                        onChange={(e) => updateTrackName(index, e.target.value)}
                        placeholder="Track name"
                        disabled={isUploading}
                        className="track-name-input"
                      />
                      {!isUploading && (
                        <button
                          onClick={() => removeFile(index)}
                          className="remove-file-btn"
                          title="Remove file"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {!isUploading && (
                  <button onClick={handleFileSelect} className="add-more-btn">
                    + Add More Files
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Upload status */}
        {uploadStatus && (
          <div className={`upload-status ${uploadStatus.includes('❌') ? 'error' : uploadStatus.includes('✅') ? 'success' : 'info'}`}>
            {uploadStatus}
          </div>
        )}

        {/* Action buttons */}
        <div className="upload-actions">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="cancel-btn"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading || (isMultiTrack && !projectName.trim())}
            className="upload-btn"
          >
            {isUploading ? (
              <>⏳ Uploading...</>
            ) : (
              <>📤 Upload {selectedFiles.length > 0 ? `(${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''})` : ''}</>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}