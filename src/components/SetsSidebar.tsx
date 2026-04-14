import { useState } from 'react';
import './SetsSidebar.css';

interface Video {
  id: string;
  title: string;
  url: string;
}

interface Set {
  id: string;
  name: string;
  videos: Video[];
}

interface SetsSidebarProps {
  onVideoSelect: (videoId: string) => void;
}

export function SetsSidebar({ onVideoSelect }: SetsSidebarProps) {
  const [sets, setSets] = useState<Set[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [newSetName, setNewSetName] = useState('');

  const selectedSet = sets.find(set => set.id === selectedSetId);

  const handleCreateSet = () => {
    if (newSetName.trim()) {
      const newSet: Set = {
        id: Date.now().toString(),
        name: newSetName.trim(),
        videos: []
      };
      setSets(prev => [...prev, newSet]);
      setNewSetName('');
      setIsCreatingSet(false);
      setSelectedSetId(newSet.id);
    }
  };

  const handleBackToSets = () => {
    setSelectedSetId(null);
  };

  return (
    <div className="sets-sidebar">
      <div className="sidebar-header">
        <h3>Practice Sets</h3>
        {selectedSet && (
          <button onClick={handleBackToSets} className="back-btn">
            ← Back to Sets
          </button>
        )}
      </div>

      {!selectedSet ? (
        // Show sets list
        <div className="sets-list">
          {sets.length === 0 ? (
            <div className="empty-state">
              <p>No sets created yet</p>
              <button
                onClick={() => setIsCreatingSet(true)}
                className="create-set-btn"
              >
                Create a Set
              </button>
            </div>
          ) : (
            <>
              <div className="sets-grid">
                {sets.map(set => (
                  <div
                    key={set.id}
                    className="set-card"
                    onClick={() => setSelectedSetId(set.id)}
                  >
                    <h4>{set.name}</h4>
                    <span className="video-count">
                      {set.videos.length} video{set.videos.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setIsCreatingSet(true)}
                className="add-set-btn"
              >
                + Add New Set
              </button>
            </>
          )}

          {isCreatingSet && (
            <div className="create-set-form">
              <input
                type="text"
                value={newSetName}
                onChange={(e) => setNewSetName(e.target.value)}
                placeholder="Set name..."
                className="set-name-input"
                autoFocus
              />
              <div className="form-buttons">
                <button onClick={handleCreateSet} className="save-btn">
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsCreatingSet(false);
                    setNewSetName('');
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Show videos in selected set
        <div className="set-videos">
          <h4>{selectedSet.name}</h4>
          {selectedSet.videos.length === 0 ? (
            <div className="empty-videos">
              <p>No videos in this set yet</p>
              <p className="hint">Load a video on the left to add it to this set</p>
            </div>
          ) : (
            <div className="videos-list">
              {selectedSet.videos.map(video => (
                <div
                  key={video.id}
                  className="video-item"
                  onClick={() => onVideoSelect(video.id)}
                >
                  <div className="video-thumbnail">📹</div>
                  <div className="video-info">
                    <span className="video-title">{video.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}