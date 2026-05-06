import { describe, test, expect, beforeEach } from 'vitest';

/**
 * Tests for volume application logic without full component rendering
 * This tests the core volume behavior that was causing issues
 */

describe('Volume Application Logic', () => {
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
    // Reset mocks and localStorage
    mockLocalStorage.clear();

    // Mock localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
  });

  // Helper function to simulate getVolumeSettings from App.tsx
  const getVolumeSettings = (): { defaultVolume: number; onlyForNewVideos: boolean } => {
    try {
      const savedSettings = localStorage.getItem('segment-studio-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        return {
          defaultVolume: settings.defaultVolume || 100,
          onlyForNewVideos: settings.defaultVolumeOnlyForNewVideos || false
        };
      }
    } catch (error) {
      console.warn('Failed to read volume settings:', error);
    }
    return { defaultVolume: 100, onlyForNewVideos: false };
  };

  // Helper function to simulate volume decision logic from handlePlayerReady
  const determineVolumeToApply = (currentSong?: { volume?: number }) => {
    const { defaultVolume, onlyForNewVideos } = getVolumeSettings();
    return onlyForNewVideos && currentSong?.volume ? currentSong.volume : defaultVolume;
  };

  describe('Volume Settings Retrieval', () => {
    test('should return default volume when settings exist', () => {
      const settings = {
        defaultVolume: 25,
        defaultVolumeOnlyForNewVideos: false,
      };
      mockLocalStorage.setItem('segment-studio-settings', JSON.stringify(settings));

      const result = getVolumeSettings();
      expect(result.defaultVolume).toBe(25);
      expect(result.onlyForNewVideos).toBe(false);
    });

    test('should return 100% as fallback when no settings exist', () => {
      // No localStorage data
      const result = getVolumeSettings();
      expect(result.defaultVolume).toBe(100);
      expect(result.onlyForNewVideos).toBe(false);
    });

    test('should handle invalid JSON gracefully', () => {
      mockLocalStorage.setItem('segment-studio-settings', 'invalid-json');

      const result = getVolumeSettings();
      expect(result.defaultVolume).toBe(100);
      expect(result.onlyForNewVideos).toBe(false);
    });

    test('should handle missing defaultVolume field', () => {
      const settings = {
        // Missing defaultVolume field
        defaultVolumeOnlyForNewVideos: true,
      };
      mockLocalStorage.setItem('segment-studio-settings', JSON.stringify(settings));

      const result = getVolumeSettings();
      expect(result.defaultVolume).toBe(100); // Should fallback to 100
      expect(result.onlyForNewVideos).toBe(true);
    });
  });

  describe('Volume Application Decision Logic', () => {
    test('should use default volume (25%) when no song is loaded', () => {
      const settings = {
        defaultVolume: 25,
        defaultVolumeOnlyForNewVideos: false,
      };
      mockLocalStorage.setItem('segment-studio-settings', JSON.stringify(settings));

      const volumeToApply = determineVolumeToApply();
      expect(volumeToApply).toBe(25);
    });

    test('should use default volume when "only for new videos" is OFF, even if song has volume', () => {
      const settings = {
        defaultVolume: 30,
        defaultVolumeOnlyForNewVideos: false, // OFF
      };
      mockLocalStorage.setItem('segment-studio-settings', JSON.stringify(settings));

      const mockSong = { volume: 80 };
      const volumeToApply = determineVolumeToApply(mockSong);

      expect(volumeToApply).toBe(30); // Should use default, not song's 80%
    });

    test('should use song volume when "only for new videos" is ON and song has volume', () => {
      const settings = {
        defaultVolume: 40,
        defaultVolumeOnlyForNewVideos: true, // ON
      };
      mockLocalStorage.setItem('segment-studio-settings', JSON.stringify(settings));

      const mockSong = { volume: 75 };
      const volumeToApply = determineVolumeToApply(mockSong);

      expect(volumeToApply).toBe(75); // Should use song's volume
    });

    test('should use default volume when "only for new videos" is ON but song has no volume', () => {
      const settings = {
        defaultVolume: 50,
        defaultVolumeOnlyForNewVideos: true, // ON
      };
      mockLocalStorage.setItem('segment-studio-settings', JSON.stringify(settings));

      const mockSong = {}; // No volume property
      const volumeToApply = determineVolumeToApply(mockSong);

      expect(volumeToApply).toBe(50); // Should use default
    });

    test('should handle edge case where song volume is 0', () => {
      const settings = {
        defaultVolume: 60,
        defaultVolumeOnlyForNewVideos: true,
      };
      mockLocalStorage.setItem('segment-studio-settings', JSON.stringify(settings));

      const mockSong = { volume: 0 };
      const volumeToApply = determineVolumeToApply(mockSong);

      expect(volumeToApply).toBe(60); // 0 is falsy, so should use default
    });

    test('should handle edge case where song volume is undefined', () => {
      const settings = {
        defaultVolume: 70,
        defaultVolumeOnlyForNewVideos: true,
      };
      mockLocalStorage.setItem('segment-studio-settings', JSON.stringify(settings));

      const mockSong = { volume: undefined };
      const volumeToApply = determineVolumeToApply(mockSong);

      expect(volumeToApply).toBe(70); // undefined is falsy, so should use default
    });
  });

  describe('Volume Range Validation', () => {
    test('should handle very high default volume values', () => {
      const settings = {
        defaultVolume: 150, // Invalid high value
        defaultVolumeOnlyForNewVideos: false,
      };
      mockLocalStorage.setItem('segment-studio-settings', JSON.stringify(settings));

      const result = getVolumeSettings();
      expect(result.defaultVolume).toBe(150); // Our function doesn't clamp, app should handle this
    });

    test('should handle negative default volume values', () => {
      const settings = {
        defaultVolume: -10, // Invalid negative value
        defaultVolumeOnlyForNewVideos: false,
      };
      mockLocalStorage.setItem('segment-studio-settings', JSON.stringify(settings));

      const result = getVolumeSettings();
      expect(result.defaultVolume).toBe(-10); // Our function doesn't clamp, app should handle this
    });
  });

  describe('Real-world Scenarios', () => {
    test('scenario: User sets app-wide volume to 25%, loads new video', () => {
      // User setting: 25% default volume, apply to all videos
      const settings = {
        defaultVolume: 25,
        defaultVolumeOnlyForNewVideos: false,
      };
      mockLocalStorage.setItem('segment-studio-settings', JSON.stringify(settings));

      // Loading a new video (no currentSong)
      const volumeToApply = determineVolumeToApply();
      expect(volumeToApply).toBe(25);
    });

    test('scenario: User sets app-wide volume to 25%, loads saved song with 80% volume, "only new videos" OFF', () => {
      // User setting: 25% default, apply to all (even saved songs)
      const settings = {
        defaultVolume: 25,
        defaultVolumeOnlyForNewVideos: false, // Apply to all videos
      };
      mockLocalStorage.setItem('segment-studio-settings', JSON.stringify(settings));

      // Loading a saved song that has its own volume setting
      const savedSong = { volume: 80 };
      const volumeToApply = determineVolumeToApply(savedSong);

      // Should use app-wide setting (25%), not the song's volume (80%)
      expect(volumeToApply).toBe(25);
    });

    test('scenario: User sets app-wide volume to 25%, loads saved song with 80% volume, "only new videos" ON', () => {
      // User setting: 25% for new videos only, respect song volumes
      const settings = {
        defaultVolume: 25,
        defaultVolumeOnlyForNewVideos: true, // Only apply to new videos
      };
      mockLocalStorage.setItem('segment-studio-settings', JSON.stringify(settings));

      // Loading a saved song that has its own volume setting
      const savedSong = { volume: 80 };
      const volumeToApply = determineVolumeToApply(savedSong);

      // Should use the song's volume (80%), not the default (25%)
      expect(volumeToApply).toBe(80);
    });
  });
});