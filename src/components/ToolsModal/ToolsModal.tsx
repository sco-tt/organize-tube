import { Modal } from '../Modal/Modal';
import { Metronome } from '../Metronome/Metronome';
import './ToolsModal.css';

export interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ToolsModal({ isOpen, onClose }: ToolsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Music Tools">
      <div className="tools-modal-content">
        <div className="tools-grid">
          <div className="tool-section">
            <Metronome />
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