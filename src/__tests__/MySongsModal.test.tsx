import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MySongsModal } from '../components/MySongsModal/MySongsModal';
import { SongRoutine } from '../repositories/songRoutineRepository';

// Mock the hooks
vi.mock('../hooks/useSavedSongs', () => ({
  useSavedSongs: vi.fn()
}));

vi.mock('../hooks/useCustomFields', () => ({
  useCustomFields: vi.fn()
}));

// Mock the Modal component to simplify testing
vi.mock('../components/Modal/Modal', () => ({
  Modal: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
    isOpen ? <div data-testid="modal">{children}</div> : null
}));

// Mock the EditSongModal component
vi.mock('../components/EditSongModal/EditSongModal', () => ({
  EditSongModal: () => <div data-testid="edit-song-modal" />
}));

import { useSavedSongs } from '../hooks/useSavedSongs';
import { useCustomFields } from '../hooks/useCustomFields';

const mockUseSavedSongs = useSavedSongs as any;
const mockUseCustomFields = useCustomFields as any;

describe('MySongsModal - Quick Load and Random Load', () => {
  const mockOnClose = vi.fn();
  const mockOnSongSelect = vi.fn();

  const sampleSongs: SongRoutine[] = [
    {
      id: '1',
      url: 'https://youtube.com/watch?v=song1',
      url_source: 'youtube',
      title: 'Test Song 1',
      artist: 'Test Artist 1',
      duration: 180,
      name: 'Song 1',
      tags_json: '["rock", "guitar"]',
      loops_json: '[]',
      steps_json: '[]',
      notes: '',
      freeform_notes: '',
      links_json: '[]',
      created_at: '2024-01-01',
      last_practiced: '2024-01-15',
      volume: 75
    },
    {
      id: '2',
      url: 'https://youtube.com/watch?v=song2',
      url_source: 'youtube',
      title: 'Test Song 2',
      artist: 'Test Artist 2',
      duration: 240,
      name: 'Song 2',
      tags_json: '["jazz", "piano"]',
      loops_json: '[]',
      steps_json: '[]',
      notes: '',
      freeform_notes: '',
      links_json: '[]',
      created_at: '2024-01-02',
      last_practiced: '2024-01-16',
      volume: 80
    },
    {
      id: '3',
      url: 'https://youtube.com/watch?v=song3',
      url_source: 'youtube',
      title: 'Test Song 3',
      artist: 'Test Artist 3',
      duration: 200,
      name: 'Song 3',
      tags_json: '["rock", "drums"]',
      loops_json: '[]',
      steps_json: '[]',
      notes: '',
      freeform_notes: '',
      links_json: '[]',
      created_at: '2024-01-03',
      last_practiced: undefined,
      volume: 85
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for useCustomFields
    mockUseCustomFields.mockReturnValue({
      fields: [],
      loading: false
    });
  });

  describe('Quick Load Options (0 saved songs)', () => {
    beforeEach(() => {
      // Mock empty songs list
      mockUseSavedSongs.mockReturnValue({
        songs: [],
        loading: false,
        error: null,
        deleteSong: vi.fn(),
        updateSong: vi.fn(),
        markPracticed: vi.fn(),
        refreshSongs: vi.fn()
      });
    });

    test('shows Quick Load Options when no songs are saved', () => {
      render(
        <MySongsModal
          isOpen={true}
          onClose={mockOnClose}
          onSongSelect={mockOnSongSelect}
        />
      );

      // Should show Quick Load Options header
      expect(screen.getByText('Quick Load Options')).toBeInTheDocument();
      expect(screen.getByText('Try these sample videos for testing the app features:')).toBeInTheDocument();

      // Should show all three default options
      expect(screen.getByText('🎸 Guitar Practice Song')).toBeInTheDocument();
      expect(screen.getByText('Popular song for guitar practice')).toBeInTheDocument();

      expect(screen.getByText('🎹 Piano Tutorial')).toBeInTheDocument();
      expect(screen.getByText('Piano lesson with clear instructions')).toBeInTheDocument();

      expect(screen.getByText('🎵 Music Theory')).toBeInTheDocument();
      expect(screen.getByText('Educational music content')).toBeInTheDocument();
    });

    test('calls onSongSelect with correct URL when quick load option is clicked', async () => {
      render(
        <MySongsModal
          isOpen={true}
          onClose={mockOnClose}
          onSongSelect={mockOnSongSelect}
        />
      );

      const guitarOption = screen.getByText('🎸 Guitar Practice Song').closest('button');
      expect(guitarOption).toBeInTheDocument();

      fireEvent.click(guitarOption!);

      await waitFor(() => {
        expect(mockOnSongSelect).toHaveBeenCalledWith('', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('does not show random load options when no songs are saved', () => {
      render(
        <MySongsModal
          isOpen={true}
          onClose={mockOnClose}
          onSongSelect={mockOnSongSelect}
        />
      );

      expect(screen.queryByText('🎲 Load Random')).not.toBeInTheDocument();
      expect(screen.queryByText('Load random from tag:')).not.toBeInTheDocument();
    });
  });

  describe('Random Load Options (with saved songs)', () => {
    beforeEach(() => {
      // Mock songs list with sample data
      mockUseSavedSongs.mockReturnValue({
        songs: sampleSongs,
        loading: false,
        error: null,
        deleteSong: vi.fn(),
        updateSong: vi.fn(),
        markPracticed: vi.fn().mockResolvedValue(undefined),
        refreshSongs: vi.fn()
      });
    });

    test('shows random load options when songs are saved', () => {
      render(
        <MySongsModal
          isOpen={true}
          onClose={mockOnClose}
          onSongSelect={mockOnSongSelect}
        />
      );

      // Should show random load button
      expect(screen.getByText('🎲 Load Random')).toBeInTheDocument();

      // Should show random from tag section
      expect(screen.getByText('Load random from tag:')).toBeInTheDocument();

      // Should show all unique tags as buttons (using title attribute to differentiate from filter tags)
      expect(screen.getByTitle('Load a random song tagged with "drums"')).toBeInTheDocument();
      expect(screen.getByTitle('Load a random song tagged with "guitar"')).toBeInTheDocument();
      expect(screen.getByTitle('Load a random song tagged with "jazz"')).toBeInTheDocument();
      expect(screen.getByTitle('Load a random song tagged with "piano"')).toBeInTheDocument();
      expect(screen.getByTitle('Load a random song tagged with "rock"')).toBeInTheDocument();
    });

    test('does not show Quick Load Options when songs are saved', () => {
      render(
        <MySongsModal
          isOpen={true}
          onClose={mockOnClose}
          onSongSelect={mockOnSongSelect}
        />
      );

      expect(screen.queryByText('Quick Load Options')).not.toBeInTheDocument();
      expect(screen.queryByText('Try these sample videos for testing the app features:')).not.toBeInTheDocument();
    });

    test('loads random song when Load Random is clicked', async () => {
      const mockMarkPracticed = vi.fn().mockResolvedValue(undefined);
      mockUseSavedSongs.mockReturnValue({
        songs: sampleSongs,
        loading: false,
        error: null,
        deleteSong: vi.fn(),
        updateSong: vi.fn(),
        markPracticed: mockMarkPracticed,
        refreshSongs: vi.fn()
      });

      render(
        <MySongsModal
          isOpen={true}
          onClose={mockOnClose}
          onSongSelect={mockOnSongSelect}
        />
      );

      const randomButton = screen.getByText('🎲 Load Random');
      fireEvent.click(randomButton);

      await waitFor(() => {
        expect(mockOnSongSelect).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockMarkPracticed).toHaveBeenCalled();
      });

      // Verify that one of the sample songs was selected
      const [songId, songUrl] = mockOnSongSelect.mock.calls[0];
      expect(['1', '2', '3']).toContain(songId);
      expect(['https://youtube.com/watch?v=song1', 'https://youtube.com/watch?v=song2', 'https://youtube.com/watch?v=song3']).toContain(songUrl);
    });

    test('loads random song from specific tag when tag button is clicked', async () => {
      const mockMarkPracticed = vi.fn().mockResolvedValue(undefined);
      mockUseSavedSongs.mockReturnValue({
        songs: sampleSongs,
        loading: false,
        error: null,
        deleteSong: vi.fn(),
        updateSong: vi.fn(),
        markPracticed: mockMarkPracticed,
        refreshSongs: vi.fn()
      });

      render(
        <MySongsModal
          isOpen={true}
          onClose={mockOnClose}
          onSongSelect={mockOnSongSelect}
        />
      );

      // Click on "rock" tag - should select from songs 1 or 3
      const rockTagButton = screen.getByTitle('Load a random song tagged with "rock"');
      fireEvent.click(rockTagButton);

      await waitFor(() => {
        expect(mockOnSongSelect).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockMarkPracticed).toHaveBeenCalled();
      });

      // Verify that only a song with "rock" tag was selected
      const [songId, songUrl] = mockOnSongSelect.mock.calls[0];
      expect(['1', '3']).toContain(songId); // Only songs 1 and 3 have "rock" tag
      expect(['https://youtube.com/watch?v=song1', 'https://youtube.com/watch?v=song3']).toContain(songUrl);
    });

    test('loads random song from jazz tag', async () => {
      const mockMarkPracticed = vi.fn().mockResolvedValue(undefined);
      mockUseSavedSongs.mockReturnValue({
        songs: sampleSongs,
        loading: false,
        error: null,
        deleteSong: vi.fn(),
        updateSong: vi.fn(),
        markPracticed: mockMarkPracticed,
        refreshSongs: vi.fn()
      });

      render(
        <MySongsModal
          isOpen={true}
          onClose={mockOnClose}
          onSongSelect={mockOnSongSelect}
        />
      );

      // Click on "jazz" tag - should select song 2 (only song with jazz tag)
      const jazzTagButton = screen.getByTitle('Load a random song tagged with "jazz"');
      fireEvent.click(jazzTagButton);

      await waitFor(() => {
        expect(mockOnSongSelect).toHaveBeenCalledWith('2', 'https://youtube.com/watch?v=song2');
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockMarkPracticed).toHaveBeenCalledWith('2');
      });
    });

    test('shows regular song list along with random load options', () => {
      render(
        <MySongsModal
          isOpen={true}
          onClose={mockOnClose}
          onSongSelect={mockOnSongSelect}
        />
      );

      // Should show random load options
      expect(screen.getByText('🎲 Load Random')).toBeInTheDocument();

      // Should also show the regular song list
      expect(screen.getByText('Test Song 1')).toBeInTheDocument();
      expect(screen.getByText('Test Song 2')).toBeInTheDocument();
      expect(screen.getByText('Test Song 3')).toBeInTheDocument();
    });
  });

  describe('Edge cases and filtered results', () => {
    test('shows empty state when search filter returns no results but songs exist', () => {
      mockUseSavedSongs.mockReturnValue({
        songs: sampleSongs,
        loading: false,
        error: null,
        deleteSong: vi.fn(),
        updateSong: vi.fn(),
        markPracticed: vi.fn(),
        refreshSongs: vi.fn()
      });

      render(
        <MySongsModal
          isOpen={true}
          onClose={mockOnClose}
          onSongSelect={mockOnSongSelect}
        />
      );

      // Type a search that won't match any songs
      const searchInput = screen.getByPlaceholderText('Search songs, artists, or tags...');
      fireEvent.change(searchInput, { target: { value: 'nonexistentsong' } });

      // Should show empty state, not Quick Load Options
      expect(screen.getByText('No songs found')).toBeInTheDocument();
      expect(screen.getByText('Try a different search term')).toBeInTheDocument();
      expect(screen.queryByText('Quick Load Options')).not.toBeInTheDocument();
    });

    test('handles songs with invalid JSON tags gracefully', () => {
      const songsWithInvalidTags = [
        {
          ...sampleSongs[0],
          tags_json: 'invalid json'
        }
      ];

      mockUseSavedSongs.mockReturnValue({
        songs: songsWithInvalidTags,
        loading: false,
        error: null,
        deleteSong: vi.fn(),
        updateSong: vi.fn(),
        markPracticed: vi.fn(),
        refreshSongs: vi.fn()
      });

      render(
        <MySongsModal
          isOpen={true}
          onClose={mockOnClose}
          onSongSelect={mockOnSongSelect}
        />
      );

      // Should still show random load button
      expect(screen.getByText('🎲 Load Random')).toBeInTheDocument();

      // Should not show "Load random from tag" section at all (since no valid tags exist)
      expect(screen.queryByText('Load random from tag:')).not.toBeInTheDocument();
      expect(screen.queryByTitle(/Load a random song tagged with/)).not.toBeInTheDocument();
    });

    test('handles empty tags array correctly', () => {
      const songsWithEmptyTags = [
        {
          ...sampleSongs[0],
          tags_json: '[]'
        }
      ];

      mockUseSavedSongs.mockReturnValue({
        songs: songsWithEmptyTags,
        loading: false,
        error: null,
        deleteSong: vi.fn(),
        updateSong: vi.fn(),
        markPracticed: vi.fn(),
        refreshSongs: vi.fn()
      });

      render(
        <MySongsModal
          isOpen={true}
          onClose={mockOnClose}
          onSongSelect={mockOnSongSelect}
        />
      );

      // Should show random load button
      expect(screen.getByText('🎲 Load Random')).toBeInTheDocument();

      // Should not show random tag section when no tags exist
      expect(screen.queryByText('Load random from tag:')).not.toBeInTheDocument();
    });
  });
});