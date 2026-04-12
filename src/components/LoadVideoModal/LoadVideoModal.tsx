import React, { useState, useCallback } from 'react';
import { Modal } from '../Modal/Modal';
import { extractVideoId, validateYouTubeUrl } from '../../utils/testYouTube';
import './LoadVideoModal.css';

interface LoadVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoLoad: (videoId: string, videoUrl: string) => void;
  currentVideoUrl: string;
}

export function LoadVideoModal({
  isOpen,
  onClose,
  onVideoLoad,
  currentVideoUrl
}: LoadVideoModalProps) {
  const [videoUrl, setVideoUrl] = useState(currentVideoUrl);

  const handleUrlSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validateYouTubeUrl(videoUrl)) {
      alert('Please enter a valid YouTube URL');
      return;
    }
    const id = extractVideoId(videoUrl);
    if (id) {
      onVideoLoad(id, videoUrl);
      onClose();
    }
  }, [videoUrl, onVideoLoad, onClose]);

  const handleQuickLoad = (url: string, title: string) => {
    const id = extractVideoId(url);
    if (id) {
      setVideoUrl(url);
      onVideoLoad(id, url);
      onClose();
    }
  };

  const quickLoadOptions = [
    {
      title: "🎸 Guitar Practice Song",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      description: "Popular song for guitar practice"
    },
    {
      title: "🎹 Piano Tutorial",
      url: "https://www.youtube.com/watch?v=09R8_2nJtjg",
      description: "Piano lesson with clear instructions"
    },
    {
      title: "🎵 Music Theory",
      url: "https://www.youtube.com/watch?v=kxopViU98Xo",
      description: "Educational music content"
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Load YouTube Video"
      size="md"
      className="load-video-modal"
    >
      <div className="load-video-content">
        <form onSubmit={handleUrlSubmit} className="url-form-modal">
          <div className="input-section">
            <label htmlFor="video-url">YouTube URL</label>
            <input
              id="video-url"
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="url-input-modal"
              autoFocus
            />
          </div>

          <button type="submit" className="load-button">
            📹 Load Video
          </button>
        </form>

        <div className="quick-load-section">
          <h4>Quick Load Options</h4>
          <p className="quick-load-description">
            Try these sample videos for testing the app features:
          </p>

          <div className="quick-options">
            {quickLoadOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleQuickLoad(option.url, option.title)}
                className="quick-option-button"
                type="button"
              >
                <span className="option-title">{option.title}</span>
                <span className="option-description">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="tips-section">
          <h4>💡 Tips</h4>
          <ul>
            <li>Paste any YouTube video URL to get started</li>
            <li>Music videos work best for practice sessions</li>
            <li>Educational content is great for study loops</li>
            <li>The video will auto-load when you unfocus the input field</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}