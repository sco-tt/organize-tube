import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';

// Mock the YouTube player first
const mockSetVolume = vi.fn();
const mockPlayVideo = vi.fn();
const mockPauseVideo = vi.fn();

// Mock modules before importing App
vi.mock('../components/YouTubePlayer.tsx', () => ({
  YouTubePlayer: React.forwardRef(({ videoId, onReady }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      setVolume: mockSetVolume,
      playVideo: mockPlayVideo,
      pauseVideo: mockPauseVideo,
      setPlaybackRate: vi.fn(),
      getCurrentTime: () => 0,
      seekTo: vi.fn(),
      getPlayerState: () => -1,
      getDuration: () => 300,
      getVolume: () => 50,
    }));

    // Simulate player ready after a short delay
    React.useEffect(() => {
      if (onReady) {
        setTimeout(onReady, 50);
      }
    }, [onReady, videoId]);

    return <div data-testid="youtube-player">Video: {videoId}</div>;
  })
}));

// Mock database service
vi.mock('../services/databaseService', () => ({
  databaseService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    executeQuery: vi.fn().mockResolvedValue([]),
  }
}));

// Mock repositories with proper constructor
vi.mock('../repositories/songRoutineRepository', () => ({
  SongRoutineRepository: class MockSongRoutineRepository {
    findAll = vi.fn().mockResolvedValue([]);
    create = vi.fn().mockResolvedValue({});
    update = vi.fn().mockResolvedValue({});
    delete = vi.fn().mockResolvedValue(undefined);
    findById = vi.fn().mockResolvedValue(null);
  }
}));

// Mock loop controls
vi.mock('../hooks/useLoopControlsSQLite', () => ({
  useLoopControlsSQLite: () => ({
    loops: [],
    activeLoop: null,
    isLooping: false,
    tempStart: null,
    tempEnd: null,
    loading: false,
    error: null,
    setLoopStart: vi.fn(),
    setLoopEnd: vi.fn(),
    saveLoop: vi.fn(),
    deleteLoop: vi.fn(),
    selectLoop: vi.fn(),
    toggleLooping: vi.fn(),
    clearLoops: vi.fn(),
    clearLoopsDisplay: vi.fn(),
    clearTempPoints: vi.fn(),
    changeTempStart: vi.fn(),
    changeTempEnd: vi.fn(),
    updateLoop: vi.fn(),
    loadSegmentsForRoutine: vi.fn(),
    loadStandaloneSegments: vi.fn(),
  })
}));

// Mock custom fields hook
vi.mock('../hooks/useCustomFields', () => ({
  useCustomFields: () => ({
    fields: [],
    loading: false,
    error: null,
    refresh: vi.fn(),
  })
}));

// Mock tags service
vi.mock('../services/tagsService', () => ({
  TagsService: {
    getInstance: () => ({
      getAllTags: vi.fn().mockResolvedValue([]),
      getTagSuggestions: vi.fn().mockResolvedValue([]),
      clearCache: vi.fn(),
      addToCache: vi.fn(),
    })
  }
}));

// Now import App after mocks are set up
import App from '../App';
import { SongRoutine } from '../repositories/songRoutineRepository';

describe('Song Load Volume Behavior', () => {
  const mockLocalStorage = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; }
    };
  })();

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockLocalStorage.clear();

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
  });

  const setVolumeSettings = (defaultVolume: number, onlyForNewVideos = false) => {
    const settings = {
      defaultVolume,
      defaultVolumeOnlyForNewVideos: onlyForNewVideos,
    };
    mockLocalStorage.setItem('segment-studio-settings', JSON.stringify(settings));
  };

  describe('Default Volume Application', () => {
    test('should apply default volume (25%) when loading new URL', async () => {
      setVolumeSettings(25);
      render(<App />);

      // Wait for app to initialize and click Load Video button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /load video/i })).toBeInTheDocument();
      });

      // Click the load video button to open modal
      fireEvent.click(screen.getByRole('button', { name: /load video/i }));

      // Find the URL input field in the modal
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter youtube url/i)).toBeInTheDocument();
      });

      // Load a new YouTube URL
      const urlInput = screen.getByPlaceholderText(/enter youtube url/i);
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });
      fireEvent.keyDown(urlInput, { key: 'Enter' });

      // Wait for player ready and volume application
      await waitFor(() => {
        expect(mockSetVolume).toHaveBeenCalledWith(25);
      }, { timeout: 500 });
    });

    test('should apply default volume (50%) when set to different value', async () => {
      setVolumeSettings(50);
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /load video/i })).toBeInTheDocument();
      });

      // Click the load video button to open modal
      fireEvent.click(screen.getByRole('button', { name: /load video/i }));

      // Find the URL input field in the modal
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter youtube url/i)).toBeInTheDocument();
      });

      const urlInput = screen.getByPlaceholderText(/enter youtube url/i);
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=test123' } });
      fireEvent.keyDown(urlInput, { key: 'Enter' });

      await waitFor(() => {
        expect(mockSetVolume).toHaveBeenCalledWith(50);
      }, { timeout: 500 });
    });

    test('should fallback to 100% when no settings exist', async () => {
      // No settings in localStorage
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /load video/i })).toBeInTheDocument();
      });

      // Click the load video button to open modal
      fireEvent.click(screen.getByRole('button', { name: /load video/i }));

      // Find the URL input field in the modal
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter youtube url/i)).toBeInTheDocument();
      });

      const urlInput = screen.getByPlaceholderText(/enter youtube url/i);
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=fallback' } });
      fireEvent.keyDown(urlInput, { key: 'Enter' });

      await waitFor(() => {
        expect(mockSetVolume).toHaveBeenCalledWith(100);
      }, { timeout: 500 });
    });
  });

  describe('Volume Timing and Player Ready', () => {
    test('should apply volume after player is ready, not immediately', async () => {
      setVolumeSettings(40);
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /load video/i })).toBeInTheDocument();
      });

      // Click the load video button to open modal
      fireEvent.click(screen.getByRole('button', { name: /load video/i }));

      // Find the URL input field in the modal
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter youtube url/i)).toBeInTheDocument();
      });

      const urlInput = screen.getByPlaceholderText(/enter youtube url/i);
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=timing-test' } });
      fireEvent.keyDown(urlInput, { key: 'Enter' });

      // Volume should not be called immediately
      expect(mockSetVolume).not.toHaveBeenCalled();

      // But should be called after player ready (with our 100ms delay)
      await waitFor(() => {
        expect(mockSetVolume).toHaveBeenCalledWith(40);
      }, { timeout: 500 });
    });

    test('should only call setVolume once per video load', async () => {
      setVolumeSettings(35);
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /load video/i })).toBeInTheDocument();
      });

      // Click the load video button to open modal
      fireEvent.click(screen.getByRole('button', { name: /load video/i }));

      // Find the URL input field in the modal
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter youtube url/i)).toBeInTheDocument();
      });

      const urlInput = screen.getByPlaceholderText(/enter youtube url/i);
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=single-call' } });
      fireEvent.keyDown(urlInput, { key: 'Enter' });

      await waitFor(() => {
        expect(mockSetVolume).toHaveBeenCalledTimes(1);
        expect(mockSetVolume).toHaveBeenCalledWith(35);
      }, { timeout: 500 });
    });
  });

  describe('Settings Validation', () => {
    test('should handle invalid localStorage data gracefully', async () => {
      // Set invalid JSON in localStorage
      mockLocalStorage.setItem('segment-studio-settings', 'invalid-json');

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /load video/i })).toBeInTheDocument();
      });

      // Click the load video button to open modal
      fireEvent.click(screen.getByRole('button', { name: /load video/i }));

      // Find the URL input field in the modal
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter youtube url/i)).toBeInTheDocument();
      });

      const urlInput = screen.getByPlaceholderText(/enter youtube url/i);
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=invalid-settings' } });
      fireEvent.keyDown(urlInput, { key: 'Enter' });

      await waitFor(() => {
        expect(mockSetVolume).toHaveBeenCalledWith(100); // Should fallback to default
      }, { timeout: 500 });
    });
  });

  describe('Multiple Video Loads', () => {
    test('should apply correct volume for each video load', async () => {
      setVolumeSettings(20);
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /load video/i })).toBeInTheDocument();
      });

      // Click the load video button to open modal
      fireEvent.click(screen.getByRole('button', { name: /load video/i }));

      // Find the URL input field in the modal
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter youtube url/i)).toBeInTheDocument();
      });

      const urlInput = screen.getByPlaceholderText(/enter youtube url/i);

      // Load first video
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=video1' } });
      fireEvent.keyDown(urlInput, { key: 'Enter' });

      await waitFor(() => {
        expect(mockSetVolume).toHaveBeenCalledWith(20);
      }, { timeout: 500 });

      vi.clearAllMocks();

      // Load second video
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=video2' } });
      fireEvent.keyDown(urlInput, { key: 'Enter' });

      await waitFor(() => {
        expect(mockSetVolume).toHaveBeenCalledWith(20);
      }, { timeout: 500 });
    });
  });
});