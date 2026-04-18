import { useState, useEffect, useCallback } from 'react';
import { SongRoutineRepository, SongRoutine, CreateSongRoutine } from '../repositories/songRoutineRepository';
import { databaseService } from '../services/databaseService';

const songRoutineRepo = new SongRoutineRepository();

export function useSavedSongs() {
  const [songs, setSongs] = useState<SongRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSongs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await databaseService.initialize();
      const data = await songRoutineRepo.findAll();
      setSongs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load songs');
      console.error('Error loading songs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSong = useCallback(async (songData: CreateSongRoutine) => {
    const saveTimeout = setTimeout(() => {
      console.error('useSavedSongs: Save operation timed out after 10 seconds');
      setError('Save operation timed out. Please try again.');
    }, 10000);

    try {
      console.log('useSavedSongs: Starting song save with data:', songData);
      setError(null);

      console.log('useSavedSongs: Calling songRoutineRepo.create...');
      const id = await songRoutineRepo.create(songData);
      console.log('useSavedSongs: Song created successfully with ID:', id);

      console.log('useSavedSongs: Refreshing songs list...');
      await loadSongs(); // Refresh the list
      console.log('useSavedSongs: Save completed successfully');

      clearTimeout(saveTimeout);
      return id;
    } catch (err) {
      clearTimeout(saveTimeout);
      console.error('useSavedSongs: Error saving song - full error:', err);
      console.error('useSavedSongs: Error type:', typeof err);
      console.error('useSavedSongs: Error toString:', err?.toString());

      const errorMsg = err instanceof Error ? err.message : 'Failed to save song';
      setError(errorMsg);
      console.error('useSavedSongs: Setting error message:', errorMsg);

      throw err;
    }
  }, [loadSongs]);

  const updateSong = useCallback(async (id: string, updates: Partial<SongRoutine>) => {
    try {
      setError(null);
      await songRoutineRepo.update(id, updates);
      await loadSongs(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update song');
      console.error('Error updating song:', err);
      throw err;
    }
  }, [loadSongs]);

  const deleteSong = useCallback(async (id: string) => {
    try {
      console.log('useSavedSongs.deleteSong: Starting delete for ID:', id);
      setError(null);
      console.log('useSavedSongs.deleteSong: Calling repository delete...');
      await songRoutineRepo.delete(id);
      console.log('useSavedSongs.deleteSong: Delete successful, refreshing list...');
      await loadSongs(); // Refresh the list
      console.log('useSavedSongs.deleteSong: Delete completed successfully');
    } catch (err) {
      console.error('useSavedSongs.deleteSong: Error deleting song:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete song');
      throw err;
    }
  }, [loadSongs]);

  const searchSongs = useCallback(async (query: string) => {
    try {
      setError(null);
      if (!query.trim()) {
        return songs;
      }
      const results = await songRoutineRepo.searchRoutines(query);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search songs');
      console.error('Error searching songs:', err);
      return [];
    }
  }, [songs]);

  const markPracticed = useCallback(async (id: string) => {
    try {
      setError(null);
      await songRoutineRepo.updateLastPracticed(id);
      await loadSongs(); // Refresh to show updated timestamp
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as practiced');
      console.error('Error marking practiced:', err);
      throw err;
    }
  }, [loadSongs]);

  const checkUrlExists = useCallback(async (url: string): Promise<boolean> => {
    const checkTimeout = setTimeout(() => {
      console.error('checkUrlExists: URL check timed out after 5 seconds');
    }, 5000);

    try {
      console.log('checkUrlExists: Starting URL check for:', url);
      console.log('checkUrlExists: Ensuring database is initialized...');
      await databaseService.initialize();
      console.log('checkUrlExists: Database initialized, calling findByUrl...');
      const existing = await songRoutineRepo.findByUrl(url);
      console.log('checkUrlExists: findByUrl completed, result:', existing);
      clearTimeout(checkTimeout);
      return !!existing;
    } catch (err) {
      clearTimeout(checkTimeout);
      console.error('checkUrlExists: Error checking URL:', err);
      return false;
    }
  }, []);

  const findSongById = useCallback(async (id: string): Promise<SongRoutine | null> => {
    try {
      return await songRoutineRepo.findById(id);
    } catch (err) {
      console.error('Error finding song by ID:', err);
      return null;
    }
  }, []);

  const refreshSongs = useCallback(async () => {
    await loadSongs();
  }, [loadSongs]);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  return {
    songs,
    loading,
    error,
    saveSong,
    updateSong,
    deleteSong,
    searchSongs,
    markPracticed,
    checkUrlExists,
    findSongById,
    refreshSongs,
  };
}